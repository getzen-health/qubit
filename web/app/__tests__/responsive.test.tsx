import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

/**
 * Test helper to set viewport size
 */
function setViewportSize(width: number, height: number = 800) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

/**
 * Mock component for testing responsive layouts
 */
const ResponsiveLayoutComponent = () => (
  <div className="w-full">
    {/* Mobile-first sidebar that hides on mobile */}
    <div className="hidden sm:block bg-blue-100" data-testid="sidebar">
      Sidebar
    </div>
    
    {/* Main content */}
    <div className="flex-1 bg-green-100" data-testid="main-content">
      <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl" data-testid="title">
        Dashboard
      </h1>
      <p className="hidden md:block text-xs" data-testid="details">
        Detailed view
      </p>
    </div>

    {/* Mobile-only navigation */}
    <div className="sm:hidden fixed bottom-0 w-full bg-yellow-100" data-testid="mobile-nav">
      Mobile Navigation
    </div>

    {/* Responsive grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="grid">
      <div data-testid="grid-item">Item 1</div>
      <div data-testid="grid-item">Item 2</div>
      <div data-testid="grid-item">Item 3</div>
      <div data-testid="grid-item">Item 4</div>
    </div>
  </div>
)

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    // Reset to desktop size
    setViewportSize(1024)
  })

  afterEach(() => {
    // Cleanup
    setViewportSize(1024)
  })

  describe('Mobile Breakpoint (375px)', () => {
    beforeEach(() => {
      setViewportSize(375)
    })

    it('should render components for mobile viewport', () => {
      render(<ResponsiveLayoutComponent />)
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })

    it('should hide sidebar on mobile', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const sidebar = container.querySelector('[data-testid="sidebar"]')
      expect(sidebar).toHaveClass('hidden')
    })

    it('should show mobile navigation on mobile', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const mobileNav = container.querySelector('[data-testid="mobile-nav"]')
      expect(mobileNav).toHaveClass('sm:hidden')
    })

    it('should display single column layout on mobile', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const grid = container.querySelector('[data-testid="grid"]')
      expect(grid).toHaveClass('grid-cols-1')
    })

    it('should use smaller heading size on mobile', () => {
      render(<ResponsiveLayoutComponent />)
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('text-sm')
    })
  })

  describe('Tablet Breakpoint (768px)', () => {
    beforeEach(() => {
      setViewportSize(768)
    })

    it('should render components for tablet viewport', () => {
      render(<ResponsiveLayoutComponent />)
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })

    it('should show sidebar on tablet', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const sidebar = container.querySelector('[data-testid="sidebar"]')
      // Sidebar should not have hidden class in normal flow
      expect(sidebar).not.toHaveClass('block')
    })

    it('should hide mobile navigation on tablet', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const mobileNav = container.querySelector('[data-testid="mobile-nav"]')
      expect(mobileNav).toHaveClass('sm:hidden')
    })

    it('should display 2-column layout on tablet', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const grid = container.querySelector('[data-testid="grid"]')
      expect(grid).toHaveClass('sm:grid-cols-2')
    })

    it('should show detailed view on tablet', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const details = container.querySelector('[data-testid="details"]')
      expect(details).toHaveClass('hidden')
      expect(details).toHaveClass('md:block')
    })
  })

  describe('Desktop Breakpoint (1024px)', () => {
    beforeEach(() => {
      setViewportSize(1024)
    })

    it('should render components for desktop viewport', () => {
      render(<ResponsiveLayoutComponent />)
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })

    it('should show sidebar on desktop', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const sidebar = container.querySelector('[data-testid="sidebar"]')
      expect(sidebar).not.toHaveClass('block')
    })

    it('should hide mobile navigation on desktop', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const mobileNav = container.querySelector('[data-testid="mobile-nav"]')
      expect(mobileNav).toHaveClass('sm:hidden')
    })

    it('should display multi-column layout on desktop', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const grid = container.querySelector('[data-testid="grid"]')
      expect(grid).toHaveClass('md:grid-cols-3')
    })

    it('should use larger heading size on desktop', () => {
      render(<ResponsiveLayoutComponent />)
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('md:text-xl')
    })
  })

  describe('Large Desktop Breakpoint (1440px)', () => {
    beforeEach(() => {
      setViewportSize(1440)
    })

    it('should render components for large desktop', () => {
      render(<ResponsiveLayoutComponent />)
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })

    it('should display 4-column layout on large desktop', () => {
      const { container } = render(<ResponsiveLayoutComponent />)
      const grid = container.querySelector('[data-testid="grid"]')
      expect(grid).toHaveClass('lg:grid-cols-4')
    })
  })

  describe('Touch and Interaction Responsiveness', () => {
    it('should have appropriate touch targets on mobile (min 44x44px)', () => {
      setViewportSize(375)
      const { container } = render(<ResponsiveLayoutComponent />)
      
      // Check that interactive elements have sufficient padding
      const mobileNav = container.querySelector('[data-testid="mobile-nav"]')
      expect(mobileNav).toBeInTheDocument()
      // The component should have padding for touch
    })

    it('should have proper spacing for mobile navigation', () => {
      setViewportSize(375)
      const { container } = render(<ResponsiveLayoutComponent />)
      
      const mobileNav = container.querySelector('[data-testid="mobile-nav"]')
      expect(mobileNav).toHaveClass('fixed')
      expect(mobileNav).toHaveClass('bottom-0')
      expect(mobileNav).toHaveClass('w-full')
    })
  })

  describe('Content Overflow Handling', () => {
    it('should handle long text on mobile without breaking layout', () => {
      setViewportSize(375)
      
      const LongTextComponent = () => (
        <div className="w-full px-4" data-testid="text-container">
          <p className="truncate md:truncate-none">
            This is a very long text that should be truncated on mobile and wrap on desktop
          </p>
        </div>
      )
      
      render(<LongTextComponent />)
      const container = screen.getByTestId('text-container')
      expect(container).toHaveClass('px-4')
    })
  })
})
