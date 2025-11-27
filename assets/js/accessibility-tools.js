/**
 * Accessible Widget Controller
 * WCAG 2.1 AA Compliant
 */

class AccessibilityWidgetController {
    constructor(options = {}) {
        // Configuration
        this.toggleButtonSelector = options.toggleButton || '.accessibility-toggle-btn';
        this.panelSelector = options.panel || '.accessibility-widget-panel';
        this.backdropSelector = options.backdrop || '.accessibility-widget-backdrop';
        
        // Elements
        this.toggleButton = document.querySelector(this.toggleButtonSelector);
        this.panel = document.querySelector(this.panelSelector);
        this.backdrop = document.querySelector(this.backdropSelector);
        
        // State
        this.isOpen = false;
        this.focusedElementBeforeOpen = null;
        this.focusableElements = [];
        this.firstFocusableElement = null;
        this.lastFocusableElement = null;
        
        // Validate required elements
        if (!this.toggleButton || !this.panel) {
            console.error('AccessibilityWidget: Required elements not found');
            return;
        }
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateFocusableElements();
        this.bindCloseButton();
    }
    
    bindCloseButton() {
        const closeButton = this.panel.querySelector('.widget-close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.close());
        }
    }
    
    bindEvents() {
        // Toggle button
        this.toggleButton.addEventListener('click', () => this.toggle());
        
        // Backdrop click
        if (this.backdrop) {
            this.backdrop.addEventListener('click', () => this.close());
        }
        
        // Click outside
        document.addEventListener('click', (e) => this.handleClickOutside(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    updateFocusableElements() {
        if (!this.panel) return;
        
        const focusableSelectors = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        this.focusableElements = Array.from(this.panel.querySelectorAll(focusableSelectors));
        this.firstFocusableElement = this.focusableElements[0];
        this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
    }
    
    toggle() {
        this.isOpen ? this.close() : this.open();
    }
    
    open() {
        this.isOpen = true;
        this.focusedElementBeforeOpen = document.activeElement;
        
        // Update ARIA and visibility
        this.toggleButton.setAttribute('aria-expanded', 'true');
        this.panel.setAttribute('aria-hidden', 'false');
        this.panel.setAttribute('data-open', 'true');
        
        if (this.backdrop) {
            this.backdrop.setAttribute('aria-hidden', 'false');
            this.backdrop.style.display = 'block';
        }
        
        // Focus management
        this.updateFocusableElements();
        if (this.firstFocusableElement) {
            // Small delay to ensure panel is visible
            setTimeout(() => {
                this.firstFocusableElement.focus();
            }, 100);
        }
        
        // Prevent body scroll
        //document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.isOpen = false;
        
        // Update ARIA and visibility
        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.panel.setAttribute('aria-hidden', 'true');
        this.panel.setAttribute('data-open', 'false');
        
        if (this.backdrop) {
            this.backdrop.setAttribute('aria-hidden', 'true');
            this.backdrop.style.display = 'none';
        }
        
        // Restore body scroll
        //document.body.style.overflow = '';
        
        // Return focus to toggle button
        if (this.focusedElementBeforeOpen) {
            this.focusedElementBeforeOpen.focus();
        } else {
            this.toggleButton.focus();
        }
    }
    
    handleClickOutside(e) {
        if (!this.isOpen) return;
        
        let targetElement = e.target;
        
        // Check if click is outside both panel and toggle button
        while (targetElement) {
            if (targetElement === this.panel || targetElement === this.toggleButton) {
                return;
            }
            targetElement = targetElement.parentNode;
        }
        
        this.close();
    }
    
    handleKeyDown(e) {
        if (!this.isOpen) return;
        
        // Escape key
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            return;
        }
        
        // Tab key - trap focus within panel
        if (e.key === 'Tab') {
            this.handleTabKey(e);
        }
    }
    
    handleTabKey(e) {
        // If no focusable elements, prevent tabbing
        if (this.focusableElements.length === 0) {
            e.preventDefault();
            return;
        }
        
        // If only one focusable element, keep focus on it
        if (this.focusableElements.length === 1) {
            e.preventDefault();
            this.firstFocusableElement.focus();
            return;
        }
        
        // Shift + Tab (backwards)
        if (e.shiftKey) {
            if (document.activeElement === this.firstFocusableElement) {
                e.preventDefault();
                this.lastFocusableElement.focus();
            }
        } 
        // Tab (forwards)
        else {
            if (document.activeElement === this.lastFocusableElement) {
                e.preventDefault();
                this.firstFocusableElement.focus();
            }
        }
    }
}


/**
 * Theme Manager - Display Modes (Light, Dark, Contrast, Greyscale)
 */
class ThemeManager {
    constructor() {
        this.storageKey = 'accessibility-theme';
        this.buttons = document.querySelectorAll('.theme-button');
        
        this.init();
    }
    
    init() {
        if (this.buttons.length === 0) return;
        
        // Load saved theme or detect system preference
        const savedTheme = this.loadTheme();
        const themeToApply = savedTheme || this.detectSystemTheme();
        this.applyTheme(themeToApply);
        
        // Listen for system theme changes
        this.watchSystemTheme();
        
        // Bind events
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => this.handleThemeChange(e));
            
            // Keyboard navigation within radio group
            button.addEventListener('keydown', (e) => this.handleKeyNav(e));
        });
    }
    
    detectSystemTheme() {
        // Check for dark mode preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark-theme';
        }
        
        // Check for high contrast preference
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            return 'high-contrast';
        }
        
        // Default to light if no preference detected
        return 'light-theme';
    }
    
    watchSystemTheme() {
        // Only watch if user hasn't set a manual preference
        if (this.loadTheme()) return;
        
        // Watch for dark mode changes
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const contrastQuery = window.matchMedia('(prefers-contrast: high)');
        
        // Modern browsers
        if (darkModeQuery.addEventListener) {
            darkModeQuery.addEventListener('change', (e) => {
                if (!this.loadTheme()) { // Only auto-switch if no manual preference
                    this.applyTheme(e.matches ? 'dark-theme' : 'light-theme');
                }
            });
            
            contrastQuery.addEventListener('change', (e) => {
                if (!this.loadTheme() && e.matches) {
                    this.applyTheme('high-contrast');
                }
            });
        }
        // Fallback for older browsers
        else if (darkModeQuery.addListener) {
            darkModeQuery.addListener((e) => {
                if (!this.loadTheme()) {
                    this.applyTheme(e.matches ? 'dark-theme' : 'light-theme');
                }
            });
            
            contrastQuery.addListener((e) => {
                if (!this.loadTheme() && e.matches) {
                    this.applyTheme('high-contrast');
                }
            });
        }
    }
    
    handleThemeChange(e) {
        const button = e.currentTarget;
        const theme = button.dataset.theme;
        
        if (theme) {
            const themeClass = theme === 'light' ? 'light-theme' :
                             theme === 'dark' ? 'dark-theme' :
                             theme === 'contrast' ? 'high-contrast' :
                             theme === 'greyscale' ? 'greyscale' : 'light-theme';
            
            this.applyTheme(themeClass);
            this.saveTheme(themeClass);
        }
    }
    
    handleKeyNav(e) {
        const currentButton = e.currentTarget;
        const buttonsArray = Array.from(this.buttons);
        const currentIndex = buttonsArray.indexOf(currentButton);
        
        let nextIndex = null;
        
        switch(e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                nextIndex = (currentIndex + 1) % buttonsArray.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                nextIndex = (currentIndex - 1 + buttonsArray.length) % buttonsArray.length;
                break;
            case 'Home':
                e.preventDefault();
                nextIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                nextIndex = buttonsArray.length - 1;
                break;
        }
        
        if (nextIndex !== null) {
            buttonsArray[nextIndex].focus();
            buttonsArray[nextIndex].click();
        }
    }
    
    applyTheme(theme) {
        const root = document.documentElement;
        
        // Remove all theme classes
        root.classList.remove('light-theme', 'dark-theme', 'high-contrast', 'greyscale');
        
        // Add new theme class
        root.classList.add(theme);
        
        // Update system preference badge visibility
        const systemBadge = document.getElementById('theme-system-badge');
        if (systemBadge) {
            const hasManualPreference = !!localStorage.getItem(this.storageKey);
            systemBadge.style.display = hasManualPreference ? 'none' : 'inline-flex';
        }
        
        // Update aria-checked states
        this.buttons.forEach(button => {
            const buttonTheme = button.dataset.theme;
            const isActive = 
                (theme === 'light-theme' && buttonTheme === 'light') ||
                (theme === 'dark-theme' && buttonTheme === 'dark') ||
                (theme === 'high-contrast' && buttonTheme === 'contrast') ||
                (theme === 'greyscale' && buttonTheme === 'greyscale');
            
            button.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });
    }
    
    saveTheme(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (e) {
            console.warn('Failed to save theme preference:', e);
        }
    }
    
    loadTheme() {
        try {
            // Return null if no saved preference (so system preference is used)
            const saved = localStorage.getItem(this.storageKey);
            return saved || null;
        } catch (e) {
            console.warn('Failed to load theme preference:', e);
            return null;
        }
    }
}


/**
 * Font Manager - Text Controls (Normal, Large, Bold)
 */
class FontManager {
    constructor() {
        this.storageKey = 'accessibility-font';
        this.defaultFont = 'normal';
        this.buttons = document.querySelectorAll('[data-font]');
        
        this.init();
    }
    
    init() {
        if (this.buttons.length === 0) return;
        
        // Load saved font
        const savedFont = this.loadFont();
        this.applyFont(savedFont);
        
        // Bind events
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => this.handleFontChange(e));
            
            // Keyboard navigation within radio group
            button.addEventListener('keydown', (e) => this.handleKeyNav(e));
        });
    }
    
    handleFontChange(e) {
        const button = e.currentTarget;
        const font = button.dataset.font;
        
        if (font) {
            this.applyFont(font);
            this.saveFont(font);
        }
    }
    
    handleKeyNav(e) {
        const currentButton = e.currentTarget;
        const buttonsArray = Array.from(this.buttons);
        const currentIndex = buttonsArray.indexOf(currentButton);
        
        let nextIndex = null;
        
        switch(e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                nextIndex = (currentIndex + 1) % buttonsArray.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                nextIndex = (currentIndex - 1 + buttonsArray.length) % buttonsArray.length;
                break;
            case 'Home':
                e.preventDefault();
                nextIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                nextIndex = buttonsArray.length - 1;
                break;
        }
        
        if (nextIndex !== null) {
            buttonsArray[nextIndex].focus();
            buttonsArray[nextIndex].click();
        }
    }
    
    applyFont(font) {
        document.documentElement.setAttribute('data-selected-font', font);
        
        // Update aria-checked states
        this.buttons.forEach(button => {
            const isActive = button.dataset.font === font;
            button.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });
    }
    
    saveFont(font) {
        try {
            localStorage.setItem(this.storageKey, font);
        } catch (e) {
            console.warn('Failed to save font preference:', e);
        }
    }
    
    loadFont() {
        try {
            return localStorage.getItem(this.storageKey) || this.defaultFont;
        } catch (e) {
            console.warn('Failed to load font preference:', e);
            return this.defaultFont;
        }
    }
}


/**
 * Visual Aid Toggle Manager (Cursor, Links, Images)
 */
class VisualAidManager {
    constructor(options) {
        this.type = options.type; // 'cursor', 'links', or 'images'
        this.storageKey = `accessibility-${this.type}`;
        this.button = document.querySelector(options.selector);
        this.attribute = options.attribute;
        this.activeValue = options.activeValue;
        this.inactiveValue = options.inactiveValue;
        
        if (!this.button) return;
        
        this.init();
    }
    
    init() {
        // Load saved state
        const savedState = this.loadState();
        this.setState(savedState);
        
        // Bind events
        this.button.addEventListener('click', () => this.toggle());
    }
    
    toggle() {
        const currentState = document.documentElement.getAttribute(this.attribute);
        const newState = currentState === this.inactiveValue;
        
        this.setState(newState);
        this.saveState(newState);
    }
    
    setState(isActive) {
        const value = isActive ? this.activeValue : this.inactiveValue;
        document.documentElement.setAttribute(this.attribute, value);
        this.button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
    
    saveState(isActive) {
        try {
            localStorage.setItem(this.storageKey, isActive ? 'active' : 'inactive');
        } catch (e) {
            console.warn(`Failed to save ${this.type} preference:`, e);
        }
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved === 'active';
        } catch (e) {
            console.warn(`Failed to load ${this.type} preference:`, e);
            return false;
        }
    }
}


/**
 * Reading Mask Manager
 * Creates a focus overlay that follows the cursor to help with reading
 */
class ReadingMaskManager {
    constructor() {
        this.storageKey = 'accessibility-reading-mask';
        this.button = document.querySelector('.js__reading-mask-toggle');
        this.maskElement = null;
        this.isActive = false;
        this.maskHeight = 60; // Height of the transparent reading area in pixels
        this.updateThrottle = null;
        
        if (!this.button) return;
        
        this.init();
    }
    
    init() {
        // Create mask element
        this.createMask();
        
        // Load saved state
        const savedState = this.loadState();
        if (savedState) {
            this.activate();
        }
        
        // Bind events
        this.button.addEventListener('click', () => this.toggle());
    }
    
    createMask() {
        // Create mask container
        this.maskElement = document.createElement('div');
        this.maskElement.className = 'reading-mask';
        this.maskElement.setAttribute('aria-hidden', 'true');
        this.maskElement.style.display = 'none';
        
        // Top mask (above reading line)
        const topMask = document.createElement('div');
        topMask.className = 'reading-mask-top';
        
        // Bottom mask (below reading line)
        const bottomMask = document.createElement('div');
        bottomMask.className = 'reading-mask-bottom';
        
        // Reading line indicator (optional visual guide)
        const readingLine = document.createElement('div');
        readingLine.className = 'reading-mask-line';
        
        this.maskElement.appendChild(topMask);
        this.maskElement.appendChild(readingLine);
        this.maskElement.appendChild(bottomMask);
        
        document.body.appendChild(this.maskElement);
        
        // Store references
        this.topMask = topMask;
        this.bottomMask = bottomMask;
        this.readingLine = readingLine;
    }
    
    toggle() {
        this.isActive ? this.deactivate() : this.activate();
    }
    
    activate() {
        this.isActive = true;
        this.maskElement.style.display = 'block';
        this.button.setAttribute('aria-pressed', 'true');
        
        // Bind mouse/touch events
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('touchmove', this.handleTouchMove);
        document.addEventListener('scroll', this.handleScroll);
        
        // Initial position
        this.updateMaskPosition(window.innerHeight / 2);
        
        // Save state
        this.saveState(true);
    }
    
    deactivate() {
        this.isActive = false;
        this.maskElement.style.display = 'none';
        this.button.setAttribute('aria-pressed', 'false');
        
        // Unbind events
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('scroll', this.handleScroll);
        
        // Save state
        this.saveState(false);
    }
    
    handleMouseMove = (e) => {
        // Throttle updates for performance
        if (this.updateThrottle) return;
        
        this.updateThrottle = setTimeout(() => {
            this.updateMaskPosition(e.clientY);
            this.updateThrottle = null;
        }, 16); // ~60fps
    }
    
    handleTouchMove = (e) => {
        if (e.touches.length === 0) return;
        
        if (this.updateThrottle) return;
        
        this.updateThrottle = setTimeout(() => {
            this.updateMaskPosition(e.touches[0].clientY);
            this.updateThrottle = null;
        }, 16);
    }
    
    handleScroll = () => {
        // Keep mask at same position during scroll
        // The mask is fixed, so it naturally stays in place
    }
    
    updateMaskPosition(mouseY) {
        const halfHeight = this.maskHeight / 2;
        const topHeight = Math.max(0, mouseY - halfHeight);
        const bottomTop = mouseY + halfHeight;
        
        // Update top mask
        this.topMask.style.height = `${topHeight}px`;
        
        // Update reading line position
        this.readingLine.style.top = `${topHeight}px`;
        this.readingLine.style.height = `${this.maskHeight}px`;
        
        // Update bottom mask
        this.bottomMask.style.top = `${bottomTop}px`;
        this.bottomMask.style.height = `calc(100vh - ${bottomTop}px)`;
    }
    
    saveState(isActive) {
        try {
            localStorage.setItem(this.storageKey, isActive ? 'active' : 'inactive');
        } catch (e) {
            console.warn('Failed to save reading mask preference:', e);
        }
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved === 'active';
        } catch (e) {
            console.warn('Failed to load reading mask preference:', e);
            return false;
        }
    }
}


/**
 * Reset Manager
 */
class ResetManager {
    constructor(managers) {
        this.managers = managers;
        this.button = document.getElementById('resetButton');
        
        if (!this.button) return;
        
        this.init();
    }
    
    init() {
        this.button.addEventListener('click', () => this.resetAll());
    }
    
    resetAll() {
        // Clear all localStorage
        try {
            const keysToRemove = [
                'accessibility-theme',
                'accessibility-font',
                'accessibility-cursor',
                'accessibility-links',
                'accessibility-images',
                'accessibility-reading-mask'
            ];
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
        }
        
        // Reset to defaults
        const root = document.documentElement;
        
        // Theme
        root.classList.remove('dark-theme', 'high-contrast', 'greyscale');
        root.classList.add('light-theme');
        
        // Font
        root.setAttribute('data-selected-font', 'normal');
        
        // Visual aids
        root.setAttribute('data-cursor', 'normal-cursor');
        root.setAttribute('data-links', 'no-highlight');
        root.setAttribute('data-images', 'images-mode');
        
        // Update UI states
        if (this.managers.theme) {
            this.managers.theme.applyTheme('light-theme');
        }
        
        if (this.managers.font) {
            this.managers.font.applyFont('normal');
        }
        
        if (this.managers.cursor) {
            this.managers.cursor.setState(false);
        }
        
        if (this.managers.links) {
            this.managers.links.setState(false);
        }
        
        if (this.managers.images) {
            this.managers.images.setState(false);
        }
        
        if (this.managers.readingMask && this.managers.readingMask.isActive) {
            this.managers.readingMask.deactivate();
        }
        
        // Announce to screen readers
        this.announceReset();
    }
    
    announceReset() {
        // Create a live region announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = 'All accessibility settings have been reset to defaults';
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
}


/**
 * Initialize All Managers
 */
function initAccessibilityWidget() {
    // Initialize widget controller
    const widgetController = new AccessibilityWidgetController({
        toggleButton: '.accessibility-toggle-btn',
        panel: '.accessibility-widget-panel',
        backdrop: '.accessibility-widget-backdrop'
    });
    
    // Initialize feature managers
    const managers = {
        theme: new ThemeManager(),
        font: new FontManager(),
        cursor: new VisualAidManager({
            type: 'cursor',
            selector: '.js__cursor-toggle',
            attribute: 'data-cursor',
            activeValue: 'big-cursor',
            inactiveValue: 'normal-cursor'
        }),
        links: new VisualAidManager({
            type: 'links',
            selector: '.js__links-toggle',
            attribute: 'data-links',
            activeValue: 'highlight',
            inactiveValue: 'no-highlight'
        }),
        images: new VisualAidManager({
            type: 'images',
            selector: '.js__images-toggle',
            attribute: 'data-images',
            activeValue: 'images-hidden',
            inactiveValue: 'images-mode'
        }),
        readingMask: new ReadingMaskManager()
    };
    
    // Initialize reset manager
    new ResetManager(managers);
    
    return { widgetController, managers };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibilityWidget);
} else {
    initAccessibilityWidget();
}
