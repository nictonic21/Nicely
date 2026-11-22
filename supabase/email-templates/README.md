# Supabase email templates

Paste these into Supabase: Authentication → Emails → Templates.

| Supabase template | Subject file | Body file |
|---|---|---|
| Confirm signup | confirm-signup.subject.txt | confirm-signup.html |
| Reset password | reset-password.subject.txt | reset-password.html |
| Change email address | change-email.subject.txt | change-email.html |

Links go to `/auth/confirm` on your own domain (with a token hash), which works
even if the email is opened on another device and keeps links on the same
domain as the sender, which helps emails avoid spam folders.
