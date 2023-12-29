const Stripe = require('stripe');
const stripe = Stripe(process.env.VUE_APP_API_STRIPE_SK);

// import { loadStripe } from '@stripe/stripe-js';
// export const stripePromise = loadStripe(process.env.VUE_APP_API_STRIPE_PK);

export default stripe