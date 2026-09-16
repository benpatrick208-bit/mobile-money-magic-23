# Clean banking app restyle

## What will change
- Refresh the visual system with crisp ink-and-mint surfaces, tighter card shapes, stronger financial typography, and quieter depth.
- Add a persistent light/dark mode control across the public site and signed-in app.
- Refine the public entry page and signed-in home so balances, actions, accounts, and activity scan faster.
- Turn account creation into a clearer short sequence with progress, focused fields, and reassuring security cues while preserving existing sign-in behavior.
- Add subtle, reduced-motion-safe transitions and improve mobile/desktop spacing.

## Technical details
- Update semantic theme tokens and typography in the global stylesheet and root font links.
- Reuse existing design-system controls and add a small shared theme control.
- Adjust shared page chrome, app shell, authentication form, and key entry/home screens only; banking logic and stored data remain unchanged.
- Verify the landing page, sign-in, sign-up, and authenticated home at mobile and desktop sizes, including dark mode.
