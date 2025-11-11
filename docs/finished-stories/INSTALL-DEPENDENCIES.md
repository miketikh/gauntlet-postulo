# Install Missing Dependencies for Story 4.7

The following Radix UI packages need to be installed for the comment system:

```bash
npm install @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-scroll-area
```

Or if using pnpm:

```bash
pnpm add @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-scroll-area
```

## Verification

After installation, verify with:

```bash
npm list @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-scroll-area
```

All packages should show version ^1.x.x

## Already Installed

The following dependencies are already present:
- ✅ date-fns (for timestamp formatting)
- ✅ @radix-ui/react-dialog (for modal)
- ✅ @radix-ui/react-label (for form labels)
- ✅ @radix-ui/react-switch (for toggle switch)

## Optional: Type Checking

Run TypeScript compiler to verify all imports:

```bash
npm run build
```

Should complete without errors related to comment components.
