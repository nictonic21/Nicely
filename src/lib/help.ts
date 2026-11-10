// Shared by the Help page and the contact route.
export const CONTACT_TOPICS = [
  "Billing or my plan",
  "Something isn't working",
  "Feedback or an idea",
  "Something else",
];

export const HELP_FAQS: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Using Nicelyy",
    items: [
      {
        q: "How do I use it?",
        a: "Type, paste or voice-note what you want to say, however messy. Pick a tone and who it's for, then press Say it nicelyy. You'll get three versions to choose from. Copy one, or send it straight to WhatsApp, Messages or email.",
      },
      {
        q: "What's a quick tweak?",
        a: "Buttons like Shorter, Softer or Firmer under your message. Each message comes with 3 free tweaks, and they don't use a message.",
      },
      {
        q: "Voice note isn't working",
        a: "Voice notes work in Chrome, Edge and Safari (including iPhone). If your browser asks, allow the microphone. Otherwise, tap the microphone on your phone's keyboard and talk.",
      },
      {
        q: "Where are my old messages?",
        a: "In History, saved on the device you used. Because we never store what you write, they don't move between devices, and they're gone if you clear your browser data.",
      },
      {
        q: "How do I add it to my home screen?",
        a: "iPhone: open Nicelyy in Safari, tap Share, then Add to Home Screen. Android: open it in Chrome, tap the menu (⋮), then Install app or Add to Home screen.",
      },
    ],
  },
  {
    group: "Plans and billing",
    items: [
      {
        q: "When do my messages top up?",
        a: "Every month, on the day your plan started. Yearly plans top up monthly too.",
      },
      {
        q: "How do I change plan, update my card or cancel?",
        a: "Go to your Account page and press Manage billing. You keep your plan until the end of the period you've paid for.",
      },
      {
        q: "Can I get a refund?",
        a: "If you cancel within 14 days of first subscribing and haven't used any paid messages, contact us and we'll refund you in full.",
      },
      {
        q: "Why didn't a message count?",
        a: "If something goes wrong on our side, the message is given back automatically.",
      },
    ],
  },
  {
    group: "Privacy and account",
    items: [
      {
        q: "Do you keep what I write?",
        a: "No. Your words are used to write your rewrite and then they're gone. We only count how many messages you've used.",
      },
      {
        q: "How do I delete my account?",
        a: "Account page, then Delete my account. It cancels any plan and deletes your account straight away.",
      },
      {
        q: "I didn't get my confirmation email",
        a: "Check your junk or spam folder. On the sign-up page you can send it again. Still nothing? Contact us below.",
      },
    ],
  },
];
