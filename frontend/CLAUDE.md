# CLAUDE DEVELOPMENT NOTES

## Project: Cinema Management Website

### UI/UX Development Guidelines

#### UI System Standards
- **Always use the NEW UI system with shadcn/ui + Tailwind CSS v4**
- **Use motion/react animations consistently across all components**
- **Follow the design patterns from `new-ui/` folder for reference**
- **Maintain the modern component-based architecture**

#### Component Architecture
- Use shadcn/ui components: Button, Card, Badge, etc.
- Import from: `'../../components/ui/button'`, `'../../components/ui/card'`, etc.
- Use Lucide React icons instead of emoji icons
- Apply consistent motion animations using `motion/react`

#### Styling Patterns
- Use Tailwind CSS v4 classes
- Apply dark theme: `bg-gray-950`, `bg-gray-900`, `bg-gray-800`
- Button fix pattern for visibility: `!bg-gray-800 !border-gray-600 !text-white hover:!bg-[color] hover:!text-white`
- Gradient headers: `bg-gradient-to-r from-[color]-900 to-[color]-800`

#### Animation Guidelines
- Use `motion.div` for containers with `initial={{ opacity: 0, y: 30 }}` and `animate={{ opacity: 1, y: 0 }}`
- Stagger animations with `transition={{ duration: 0.4, delay: index * 0.05 }}`
- Apply hover animations: `whileHover={{ scale: 1.02 }}`

### API Integration Rules
- **PRESERVE 100% of existing API service logic**
- Never modify service calls or business logic during UI updates
- Keep all error handling and data fetching patterns unchanged
- Maintain pagination, filtering, and search functionality exactly as implemented

### File Organization
- User pages: `src/pages/user/`
- Admin pages: `src/pages/admin/`
- Components: `src/components/ui/`
- Services: `src/services/`
- Types: `src/types/`

### Migration Completed ✅
- All pages migrated from inline React.CSSProperties to modern UI
- Button visibility issues resolved across 8 files and 20 buttons
- AllShowtimesPage created with comprehensive filtering and pagination
- Sign In navigation functionality fixed
- Backup files cleaned up

---

## Notes History

### 2024-02-17
- ✅ Migration Phase completed successfully
- ✅ UI system fully modernized with shadcn/ui + Tailwind CSS v4
- ✅ All user-reported issues resolved (blank buttons, non-clickable elements)
- ✅ Codebase cleaned up, backup files removed
- 📝 **Future development should always follow the NEW UI patterns established in this migration**

---

*This file contains development notes and guidelines for Claude AI assistant when working on this Cinema Management Website project.*