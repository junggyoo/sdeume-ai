import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardLayout } from './DashboardLayout';

describe('DashboardLayout', () => {
  describe('Rendering', () => {
    it('should render children in the main content area', () => {
      render(
        <DashboardLayout>
          <div data-testid="content">Main Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should render the sidebar slot when provided', () => {
      render(
        <DashboardLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByText('Sidebar')).toBeInTheDocument();
    });

    it('should render without sidebar when not provided', () => {
      render(
        <DashboardLayout>
          <div data-testid="content">Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should have a layout container', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should use grid layout on desktop', () => {
      render(
        <DashboardLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </DashboardLayout>
      );

      const container = screen.getByTestId('dashboard-layout');
      expect(container).toHaveClass('md:grid-cols-[280px_1fr]');
    });

    it('should have gap between sidebar and content', () => {
      render(
        <DashboardLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </DashboardLayout>
      );

      const container = screen.getByTestId('dashboard-layout');
      expect(container).toHaveClass('gap-6');
    });

    it('should have main content area with flexible width', () => {
      render(
        <DashboardLayout sidebar={<div>Sidebar</div>}>
          <div data-testid="content">Content</div>
        </DashboardLayout>
      );

      const mainArea = screen.getByRole('main');
      expect(mainArea).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should hide sidebar on mobile with hidden class', () => {
      render(
        <DashboardLayout sidebar={<div data-testid="sidebar-content">Sidebar</div>}>
          <div>Content</div>
        </DashboardLayout>
      );

      const sidebarContainer = screen.getByTestId('sidebar-container');
      expect(sidebarContainer).toHaveClass('hidden');
      expect(sidebarContainer).toHaveClass('md:block');
    });

    it('should show sidebar on desktop with md:block class', () => {
      render(
        <DashboardLayout sidebar={<div data-testid="sidebar-content">Sidebar</div>}>
          <div>Content</div>
        </DashboardLayout>
      );

      const sidebarContainer = screen.getByTestId('sidebar-container');
      expect(sidebarContainer).toHaveClass('md:block');
    });

    it('should use single column layout without sidebar classes on mobile', () => {
      render(
        <DashboardLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </DashboardLayout>
      );

      const container = screen.getByTestId('dashboard-layout');
      // Should have the grid class that applies on md+
      expect(container).toHaveClass('md:grid-cols-[280px_1fr]');
    });
  });

  describe('Accessibility', () => {
    it('should have main landmark role for content area', () => {
      render(
        <DashboardLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have aside landmark role for sidebar when present', () => {
      render(
        <DashboardLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </DashboardLayout>
      );

      const aside = screen.getByRole('complementary');
      expect(aside).toBeInTheDocument();
    });

    it('should not render aside when sidebar is not provided', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });
  });

  describe('Props - className', () => {
    it('should apply custom className to container', () => {
      render(
        <DashboardLayout className="custom-class">
          <div>Content</div>
        </DashboardLayout>
      );

      const container = screen.getByTestId('dashboard-layout');
      expect(container).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(
        <DashboardLayout className="bg-red-500">
          <div>Content</div>
        </DashboardLayout>
      );

      const container = screen.getByTestId('dashboard-layout');
      expect(container).toHaveClass('bg-red-500');
      expect(container).toHaveClass('gap-6');
    });
  });

  describe('Background and Styling', () => {
    it('should have surface background color', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const container = screen.getByTestId('dashboard-layout');
      expect(container).toHaveClass('bg-surface');
    });

    it('should have minimum height of full viewport', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const container = screen.getByTestId('dashboard-layout');
      expect(container).toHaveClass('min-h-screen');
    });

    it('should have proper padding', () => {
      render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const container = screen.getByTestId('dashboard-layout');
      expect(container.className).toMatch(/p-/);
    });
  });
});
