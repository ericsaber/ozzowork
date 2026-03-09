

## Plan: Set Up New ozzo Email Domain

You have a new ozzo domain you'd like to use for sending emails. Here's the plan:

### Step 1: Set up the new email domain
You'll need to configure DNS records for your new ozzo domain through the email setup dialog. This will guide you through adding the required DNS records at your domain registrar.

### Step 2: Scaffold and brand email templates
Once the domain is added, I'll re-scaffold the auth email templates to use the new ozzo domain and redeploy the `auth-email-hook` edge function.

### Step 3: Update the follow-up reminder function
The `send-followup-reminders` edge function also references the old domain in the app URL. I'll update that to point to the correct ozzo URL.

### Technical Details
- The verified email domain is currently `app.ollo.work` — this will be replaced by your new ozzo domain
- `auth-email-hook/index.ts` constants (`SENDER_DOMAIN`, `ROOT_DOMAIN`, `FROM_DOMAIN`) will be updated to the new domain
- `send-followup-reminders/index.ts` app URL will be updated
- Both edge functions will be redeployed

### First Step: Add Your Domain
Let's start by setting up your new sender domain. Click below to begin:

<lov-actions>
<lov-open-email-setup>Set up email domain</lov-open-email-setup>
</lov-actions>

