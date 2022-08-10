import { MultiBot } from './multi_bot';
import dotenv from 'dotenv';
dotenv.config();

new MultiBot().login(process.env.TOKEN!).then(() => {
    console.log('logged in');
});
