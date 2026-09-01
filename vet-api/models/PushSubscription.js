// models/PushSubscription.js
//
// Web Push subscriptions (ειδοποιήσεις κινητού) — μία εγγραφή ανά
// συσκευή/browser που έχει ενεργοποιήσει ειδοποιήσεις για αυτή την κλινική.
import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export { pushSubscriptionSchema };
const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);
export default PushSubscription;
