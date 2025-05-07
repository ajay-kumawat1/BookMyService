import { Router } from "express";
import {
  purchaseBooking,
  purchaseSubscription,
  linkBankAccount,
  cancelSubscription,
  createAccountOwner,
  transfer,
  transferToBank,
  deleteBankAccount,
  updateBankAccount,
  refund,
  getBalance
} from './StripeService.js'
import { validJWTNeeded } from "../../Middleware/auth.middleware.js";

const router = Router();

// router.post('/payment-intent', validJWTNeeded, async (req, res) => {
//   try {
//     console.log('[stripe-services] POST /payment-intent received with body:', req.body); // Debug log
//     console.log('[stripe-services] req.user:', req.user); // Debug log

//     const { amount } = req.body;
//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: 'Invalid amount provided' });
//     }

//     const result = await purchaseBooking(amount, req);
//     res.status(200).json({ clientSecret: result.payment.client_secret });
//   } catch (error) {
//     console.error('[stripe-services] Payment intent error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });
router.post('/payment-intent', validJWTNeeded, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0 || !Number.isFinite(amount)) {
      console.log('[stripe-services] Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid amount: must be a positive number' });
    }

    const result = await purchaseBooking(amount, req);
    const clientSecret = result.payment.client_secret;

    if (!clientSecret) {
      throw new Error('Failed to generate clientSecret');
    }

    res.status(200).json({ clientSecret });
  } catch (error) {
    console.error('[stripe-services] Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Subscription routes
router.post('/subscriptions', validJWTNeeded, async (req, res) => {
  try {
    const result = await purchaseSubscription(req, res);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/subscriptions/:subscriptionId', validJWTNeeded, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const result = await cancelSubscription(subscriptionId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bank account routes
router.post('/bank-accounts/link', validJWTNeeded, async (req, res) => {
  try {
    const { bankId, accountId } = req.body;
    const result = await linkBankAccount(bankId, accountId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bank-accounts/create-owner', validJWTNeeded, async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const result = await createAccountOwner(firstName, lastName, email, phone);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bank-accounts/:accountId/:bankId', validJWTNeeded, async (req, res) => {
  try {
    const { accountId, bankId } = req.params;
    const result = await deleteBankAccount(accountId, bankId);
    res.status(200).json({ deleted: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/bank-accounts/:accountId/:bankId', validJWTNeeded, async (req, res) => {
  try {
    const { accountId, bankId } = req.params;
    const { holderName } = req.body;
    const result = await updateBankAccount(accountId, bankId, holderName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer routes
router.post('/transfers', validJWTNeeded, async (req, res) => {
  try {
    const { account, amount } = req.body;
    const result = await transfer(account, amount);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transfers/to-bank', validJWTNeeded, async (req, res) => {
  try {
    const { account, bankId, amount } = req.body;
    const result = await transferToBank(account, bankId, amount);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refund route
router.post('/refunds', validJWTNeeded, async (req, res) => {
  try {
    const { chargeId, amount } = req.body;
    const result = await refund(chargeId, amount);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Balance route
router.get('/balance/:accountId', validJWTNeeded, async (req, res) => {
  try {
    const { accountId } = req.params;
    const result = await getBalance(accountId);
    res.status(200).json({ balance: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;