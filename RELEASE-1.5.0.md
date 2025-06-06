# QL Input & Parser v1.5.0 Release Notes

**Release Date:** June 6, 2025  
**Packages:** `@abaktiar/ql-input@1.5.0` and `@abaktiar/ql-parser@1.5.0`

## 🎉 Major Enhancements

### 🎯 Smart Suggestion Behavior
Experience enhanced UX with intelligent suggestion control:
- **Manual Control**: Suggestions appear only when you type a space or use `Ctrl+Space`
- **No Auto-spacing**: Selecting suggestions no longer adds automatic spaces
- **Less Intrusive**: More controlled query-building experience
- **New Shortcut**: Press `Ctrl+Space` anytime to manually trigger suggestions

### 🚀 Smooth & Minimal Visual Design
Lightning-fast and beautiful interface improvements:
- **Ultra-fast Transitions**: Reduced from 200ms to 80ms for snappy feel
- **Minimal Selection States**: Clean, subtle backgrounds with blue border accents
- **Consistent Interactions**: Mouse hover and keyboard navigation look identical
- **Optimized Performance**: Specific CSS transitions for smooth animations

### ⌨️ Enhanced Keyboard Navigation
Perfect accessibility with seamless navigation:
- **Auto-scroll to Selection**: Selected suggestions automatically scroll into view
- **Smooth Scrolling**: CSS and JavaScript smooth scrolling for polished experience
- **No Hidden Items**: All suggestions accessible via keyboard, regardless of list length
- **Perfect UX**: Navigate through hundreds of suggestions effortlessly

## 🔧 Technical Improvements

### Parser Engine
- Enhanced function system with comprehensive parameterized function support
- Improved expression trees for complex nested expressions
- Better validation for function parameters with descriptive error messages
- Robust parsing for function calls in various contexts

### Component Architecture
- Smart state management with `justSelectedSuggestion` flag
- Optimized suggestion rendering with data attributes for scroll targeting
- Enhanced keyboard event handling for better user experience
- Framework-independent CSS with comprehensive theming support

## 📚 Documentation & Examples

### Comprehensive Updates
- Updated all README files with v1.5.0 highlights
- Enhanced examples showcasing new features
- Complete migration guides for upgrading
- Extensive testing documentation and procedures

### Real-World Examples
- Issue tracking system examples
- E-commerce product search patterns
- Advanced configuration examples
- Performance optimization techniques

## 🎯 Usage Examples

### Smart Suggestion Behavior Flow
```typescript
// 1. Type & Select: Type "pro" → select "project" → no suggestions appear
// 2. Add Space: Type a space → operator suggestions appear  
// 3. Manual Trigger: Press Ctrl+Space → context-appropriate suggestions show
// 4. Continue Building: Repeat for complex queries
```

### Enhanced Keyboard Navigation
```typescript
// Navigate with arrow keys through long suggestion lists
// Selected items automatically scroll into view
// Smooth animations for professional feel
```

### Parameterized Functions
```sql
-- Enhanced function support with parameters
assignee = userInRole("admin") AND created >= daysAgo(30)
project = projectsWithPrefix("PROJ") AND status IN ("open", "pending")
created = dateRange("2023-01-01", "2023-12-31") ORDER BY priority DESC
```

## 🚀 Getting Started

### Installation
```bash
npm install @abaktiar/ql-input@1.5.0
# or
npm install @abaktiar/ql-parser@1.5.0
```

### Basic Usage
```tsx
import { QLInput } from '@abaktiar/ql-input';
import '@abaktiar/ql-input/styles.css';

function MyComponent() {
  return (
    <QLInput
      config={config}
      placeholder="Try the new smart suggestions!"
      onChange={(value, query) => console.log(query)}
    />
  );
}
```

## 🎨 Visual Improvements

### New Color Scheme
- **Light Theme**: Subtle gray backgrounds (`#e2e8f0`) with blue accents
- **Dark Theme**: Elegant dark grays (`#4b5563`) with light blue highlights
- **Consistent States**: Hover and keyboard selection use identical styling
- **Smooth Transitions**: 80ms transitions for instant feedback

### Enhanced Accessibility
- Perfect keyboard navigation with auto-scroll
- Unified interaction states for consistency
- ARIA attributes for screen readers
- High contrast mode support

## 🔄 Migration Guide

### From v1.4.x to v1.5.0
✅ **Fully Backward Compatible** - No breaking changes required!

### Optional Enhancements
- Take advantage of new `Ctrl+Space` shortcut
- Enjoy faster, smoother interactions automatically
- Enhanced keyboard navigation works out of the box

## 🎯 What's Next

This release establishes QL Input & Parser as the premier solution for query interfaces with:
- Professional-grade UX matching industry standards
- Lightning-fast performance and smooth animations  
- Perfect accessibility and keyboard navigation
- Comprehensive parameterized function support

**Ready to upgrade?** Install v1.5.0 today and experience the enhanced query-building interface!

---

## Links
- **[Live Demo](https://ql-input.netlify.app/)** - Try v1.5.0 features
- **[npm - ql-input](https://www.npmjs.com/package/@abaktiar/ql-input)** - React component
- **[npm - ql-parser](https://www.npmjs.com/package/@abaktiar/ql-parser)** - Framework-agnostic parser
- **[GitHub Repository](https://github.com/abaktiar/ql-input)** - Source code and issues
- **[Documentation](README.md)** - Complete setup and usage guide
