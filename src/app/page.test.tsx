import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page.js';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('LoginPage', () => {
  it('should render login form with username and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'INICIAR SESIÓN' })).toBeInTheDocument();
  });

  it('should disable submit button when fields are empty', () => {
    render(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: 'INICIAR SESIÓN' });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when fields are filled', () => {
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: 'INICIAR SESIÓN' });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(submitButton).not.toBeDisabled();
  });

  it('should capture text input correctly', () => {
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('Usuario') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Contraseña') as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  it('should show loading state during form submission', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => ({ role: 'ADMIN' }) }), 100))
    );

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: 'INICIAR SESIÓN' });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should show error message on failed login', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 401, json: () => ({ error: 'Unauthorized' }) })
    );

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText('Usuario');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: 'INICIAR SESIÓN' });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
    });
  });
});
