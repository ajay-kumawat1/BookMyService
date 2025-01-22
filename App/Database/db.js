import mongoose from 'mongoose';

const connectDatabase = () => {
    mongoose.connect(process.env.DB_URL, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }).then(
        () => console.log('⚡️[NodeJs server]: Database connection established and connected to Node Web Server.'),
    ).catch((err) => console.log(err));
};

export default connectDatabase;
