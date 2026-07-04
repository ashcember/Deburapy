---
name: Deburapy
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#434841'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#737971'
  outline-variant: '#c3c8bf'
  surface-tint: '#4a654a'
  primary: '#4a654a'
  on-primary: '#ffffff'
  primary-container: '#8ba889'
  on-primary-container: '#243d25'
  inverse-primary: '#b0ceae'
  secondary: '#8b4e3d'
  on-secondary: '#ffffff'
  secondary-container: '#fdad98'
  on-secondary-container: '#783f2f'
  tertiary: '#5e5e5c'
  on-tertiary: '#ffffff'
  tertiary-container: '#a1a09d'
  on-tertiary-container: '#373735'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ccebc8'
  primary-fixed-dim: '#b0ceae'
  on-primary-fixed: '#07200b'
  on-primary-fixed-variant: '#334d34'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb5a1'
  on-secondary-fixed: '#380d03'
  on-secondary-fixed-variant: '#6f3728'
  tertiary-fixed: '#e4e2de'
  tertiary-fixed-dim: '#c8c6c3'
  on-tertiary-fixed: '#1b1c1a'
  on-tertiary-fixed-variant: '#474744'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 24px
  section-gap: 64px
---

## Brand & Style
The design system is centered on the concept of a "Digital Sanctuary"—a space for mediation, reflection, and de-escalation between humans and AI. The brand personality is empathetic, grounded, and patient. It moves away from the frenetic, high-contrast nature of traditional tech interfaces toward a more organic, slow-paced aesthetic.

The visual style blends **Soft Minimalism** with **Organic Glassmorphism**. By using a palette inspired by nature and tactile materials, the interface reduces cognitive load and encourages mindful interaction. The emotional goal is to lower the user's heart rate and foster a sense of psychological safety.

## Colors
This design system utilizes a "Low-Stimulus" palette to ensure a therapeutic environment:
- **Primary (Sage Green):** Used for growth-oriented actions and primary navigation. It represents harmony and peace.
- **Secondary (Muted Terracotta):** Reserved for subtle highlights, emotional cues, or "warmth" in the interface. Use sparingly to avoid overstimulation.
- **Background (Cream/Beige):** A soft #FDFBF7 base that is easier on the eyes than pure white, providing a parchment-like warmth.
- **Text (Charcoal):** A softened black (#3A3A3A) to maintain high legibility without the harshness of #000000.

## Typography
The typography strategy prioritizes approachability and softness.
- **Headlines:** Uses **Quicksand**. Its rounded terminals feel friendly and non-confrontational, ideal for a mediation tool.
- **Body & Labels:** Uses **Plus Jakarta Sans**. It maintains a clean, modern aesthetic with slightly wider apertures than standard sans-serifs, ensuring high readability during long mediation sessions.
- **Chinese Typesetting:** For the name "人機關係協調員," ensure a weight that matches the English Quicksand bold to maintain visual balance.

## Layout & Spacing
The layout philosophy is "Spacious & Breathable." Negative space is not "empty"—it is a functional tool used to give users room to think.
- **Grid:** A centered, fixed-width column for the main mediation flow (max-width 800px) to prevent eye fatigue.
- **Rhythm:** Use an 8px base unit. Elements should be spaced generously; favor `section-gap` between different modules to signify a transition in thought or topic.
- **Mobile:** Margins remain wide (20px) to keep the content feeling contained and safe rather than edge-to-edge and urgent.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Ambient Shadows** rather than stark borders.
- **The Glass Effect:** Chat bubbles and floating panels use a semi-transparent white (opacity 60-80%) with a `20px` backdrop blur. This allows the warm cream background to peak through, maintaining a sense of continuity.
- **Shadows:** Use very large, soft blurs (e.g., `box-shadow: 0 10px 40px rgba(139, 168, 137, 0.1)`). The shadow color should be tinted with the primary Sage Green to keep the "grounded" feel.
- **Layers:** Only three layers of depth are allowed: Base (Cream), Content (Glass/White), and Interaction (Primary Color).

## Shapes
Shapes are organic and heavily rounded. This design system avoids sharp corners entirely, as they represent "points of conflict."
- **Containers:** All primary containers and cards use a minimum of `24px` radius.
- **Pills:** Interactive elements like buttons and chips should be fully rounded (pill-shaped) to feel tactile and soft.
- **Organic Orbs:** Subtle, large-scale blobs of Sage and Terracotta with heavy Gaussian blurs (100px+) should be used in the background to break the rigidity of the digital grid.

## Components
- **Buttons:** Large, pill-shaped buttons with significant horizontal padding. The "Primary" state is solid Sage with Charcoal text. "Secondary" buttons use a thin 1px Sage border or a subtle cream tint.
- **Chat Bubbles:** These are the heart of the interface. Human messages use the Glassmorphism style (semi-transparent), while AI mediator messages use a solid, very pale Sage background to denote its role as a steadying force.
- **Input Fields:** Large `24px` rounded fields with a soft cream-to-white gradient. The focus state should be a soft Sage glow rather than a sharp border.
- **Mediation Chips:** Used for mood selection or quick replies. These are pill-shaped, using the secondary Terracotta color at 10% opacity for a "blush" effect.
- **The "Pause" Component:** A unique component for this system—a large, circular button that allows either party to temporarily halt the mediation to take a breath, styled with a pulsing, soft shadow.