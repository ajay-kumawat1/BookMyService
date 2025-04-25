import Stripe from 'stripe';
import Card from '../../Models/Card.js';
import UserBank from '../../Models/UserBank.js';

const secretKey = process.env.STRIPE_SECRET_KEY;
const publicKey = process.env.STRIPE_PUBLIC_KEY;
const stripe = new Stripe(secretKey);
const publicStripe = new Stripe(publicKey);

const createToken = async (id) => {
    try {
        const card = await Card.findById(id).lean();
        if (!card) throw new Error('Card not found.');

        const { number, cvv, expiration } = card;
        const [month, year] = expiration.split('/').map(Number);
        if (!month || !year) {
            throw new Error('Invalid expiration date format.');
        }

        const token = await publicStripe.tokens.create({
            card: {
                number: number,
                exp_month: month,
                exp_year: year,
                cvc: cvv,
            },
        });
        return token.id;
    } catch (error) {
        console.error('Error creating token:', error);
        throw error;
    }
};

const createCustomer = async (user) => {
    try {
        let customerId = user?.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
            });
            user.stripe_customer_id = customer.id;
            await user.save();
            return user;
        }
    } catch (error) {
        console.error('Error creating customer:', error);
        throw error;
    }
};

const createPaymentIntent = async (amount, discount, user, customerId, sourceId) => {
    try {
        return await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: 'usd',
            customer: customerId,
            payment_method: sourceId,
            off_session: true,
            confirm: true,
            description: 'Payment for exported goods',
            shipping: {
                name: user.first_name,
                address: {
                    line1: '123 Main Street',
                    line2: '123 Main Street',
                    city: 'New York',
                    state: 'NY',
                    postal_code: '10001',
                    country: 'US',
                },
            },
            metadata: {
                discount: discount,
            },
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
};

const purchaseBooking = async (amount, discount, cardId, req, res) => {
    try {
        const user = await getLoginUser(req);
        const tokenID = await createToken(cardId);

        let customerId = user.stripe_customer_id;
        if (!customerId && user.role === ROLE.ARTIST) {
            customerId = await createCustomer(user);
        }

        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: { token: tokenID },
            billing_details: {
                name: user.name,
                email: user.email,
            },
        });

        await stripe.paymentMethods.attach(paymentMethod.id, {
            customer: customerId,
        });

        const payment = await createPaymentIntent(amount, discount, user, customerId,
            paymentMethod.id);
        const receipt = await getCharge(payment.latest_charge)
        
        return {
            payment,
            receipt
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).
            send({ error: error.message || 'Internal Server Error' });
        throw error;
    }
};

const getCharge = async (chargeId) => {
    try {
        const charge = await stripe.charges.retrieve(chargeId);
        return charge.receipt_url; // Receipt URL
    } catch (error) {
        console.error('Error retrieving charge:', error);
        throw error;
    }
};

const purchaseSubscription = async (req, res) => {
    try {
        const user = await getLoginUser(req);
        const plan = await Plan.findById(req.body.plan);
        let priceId = process.env.AUTO_BILLING_BASIC_PLAN_PRICE_ID;

        if (PLAN_TYPE.ANNUAL === plan.type) {
            priceId = process.env.AUTO_BILLING_ANNUAL_PLAN_PRICE_ID;
        }

        if (!priceId) return res.status(400).send({ 
                error: 'Price ID is not configured.' 
            });
        

        const tokenID = await createToken(req.body.card);

        let customerId = await user.stripe_customer_id;
        if (!customerId) {
            let { stripe_customer_id } = await createCustomer(user);
            customerId = stripe_customer_id;
        }
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: { token: tokenID },
            billing_details: {
                name: user.name,
                email: user.email,
            },
        });

        await stripe.paymentMethods.attach(paymentMethod.id, {
            customer: customerId,
        });

        return await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            default_payment_method: paymentMethod.id,
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                discount: 0,
            },
        });
    } catch (error) {
        console.error('Error processing subscription:', error);
        return res.status(500).
            send({ error: error.message || 'Internal Server Error' });
    }
};

const cancelSubscription = async (subscriptionId) => {
    return await stripe.subscriptions.cancel(subscriptionId);
};

const createBankAccount = async (id,session) => {
    const bank = await UserBank.findById(id).session(session);

    // Check if the bank account exists
    if (!bank) {
        throw new Error(`Bank account with id ${id} not found.`);
    }

    const { bank_number, holder_name } = bank;

    const token = await stripe.tokens.create({
        bank_account: {
            country: 'US',
            currency: 'usd',
            account_holder_name: holder_name,
            account_holder_type: 'individual',
            routing_number: '110000000',
            account_number: bank_number,
        },
    });

    return token.id;
};

const linkBankAccount = async (id, accountId,session = {}) => {
    const bankToken = await createBankAccount(id,session);

    const externalAccount = await stripe.accounts.createExternalAccount(
        accountId,
        {
            external_account: bankToken,
        },
    );

    return externalAccount.id;
};

const createAccountOwner = async (first_name, last_name,email,phone) => {
    return await stripe.accounts.create({
        type: 'custom',
        country: 'US',
        email: email,
        business_type: 'individual',
        individual: {
            address: {
                line1: '123 Example St',
                postal_code: '2000',
                state: 'CA',
                city: 'San Francisco',
            },
            dob: {
                day: 1,
                month: 1,
                year: 1901, 
            },
            email: email,
            phone: phone,
            first_name: first_name,
            last_name: last_name,
            maiden_name: first_name +last_name,
            id_number: '000000000', // Ensure this ID is valid for your test scenario
        },
        business_profile: {
            mcc: '4215',
            product_description: 'Software service',
            support_email: 'rahul@gmail.com',
            support_phone: '+14155552672',
            url: 'https://accessible.stripe.com', 
        },
        tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: '8.8.8.8',
        },
        capabilities: {
            card_payments: {
                requested: true,
            },
            transfers: {
                requested: true,
            },
        },
    });
}

const transfer = async (account, amount) => {
    return await stripe.transfers.create({
        amount: amount * 100,
        currency: 'usd',
        destination: account,
        transfer_group: 'ORDER_95',
    });
};

const transferToBank = async (account,bankId,amount) => {
    if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount provided.');
    }
    
    return await stripe.payouts.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: bankId,
        description: 'Payout to external bank account',
    }, {
        stripeAccount: account,
    });
};

const deleteBankAccount = async (stripe_account_id, stripe_bank_id) => {
    const { deleted } = await stripe.accounts.deleteExternalAccount(stripe_account_id, stripe_bank_id);
    return deleted;
};

const updateBankAccount = async (stripe_account_id, stripe_bank_id, holder_name) => {
    try {
        return await stripe.accounts.updateExternalAccount(
            stripe_account_id,
            stripe_bank_id,
            {
                account_holder_name: holder_name,
            }
        );
        
    } catch (err) {
        throw new Error(`Stripe update failed: ${err.message}`);
    }
};

const refund = async (chargeId,amount) =>{
    const refundResult = await stripe.refunds.create({
        charge: chargeId,
        amount:amount * 100
    });
    const receipt = await getCharge(refundResult.charge);
    
    return {
        refundResult,
        receipt
    }
}

const getBalance = async (stripe_account_id) => {
    let balance = await stripe.balance.retrieve({},
        { stripeAccount: stripe_account_id });
    return balance.available[0].amount / 100;
};

export {
    purchaseBooking,
    purchaseSubscription,
    linkBankAccount,
    cancelSubscription,
    createCustomer,
    createAccountOwner,
    transfer,
    transferToBank,
    deleteBankAccount,
    updateBankAccount,
    refund,
    getBalance
};