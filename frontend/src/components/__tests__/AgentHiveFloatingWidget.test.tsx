import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AgentHiveFloatingWidget from '../components/AgentHiveFloatingWidget';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, ...props }: any) => (
      <div style={style} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  useMotionValue: (initial: number) => ({
    get: () => initial,
    set: jest.fn(),
    getPrevious: () => initial,
  }),
  useTransform: () => 0,
}));

// Mock LogoText component
jest.mock('../components/LogoText', () => {
  return function MockLogoText({ size, showOnlyBubble, animated }: any) {
    return (
      <div data-testid="logo-text">
        Mock LogoText - Size: {size}, BubbleOnly: {showOnlyBubble?.toString()}, Animated: {animated?.toString()}
      </div>
    );
  };
});

// Mock hooks
jest.mock('../hooks/useHexFlightPath', () => ({
  useHexFlightPath: () => ({
    x: [100, 200, 300, 400, 500, 600],
    y: [100, 150, 200, 150, 100, 100],
  }),
  useViewportDimensions: () => ({
    width: 1200,
    height: 800,
  }),
}));

// Create mock store
const createMockStore = () => {
  const mockStore = configureStore({
    reducer: {
      theme: (state = { mode: 'light' }) => state,
    },
  });
  return mockStore;
};

// Test theme
const testTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#c8102e' },
    secondary: { main: '#C49F55' },
  },
});

// Wrapper component for tests
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={createMockStore()}>
    <ThemeProvider theme={testTheme}>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('AgentHiveFloatingWidget', () => {
  const mockOnOpenChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the bee widget', () => {
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget onOpenChat={mockOnOpenChat} />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: 'Open AgentHive chat assistant' })).toBeInTheDocument();
    expect(screen.getByTestId('logo-text')).toBeInTheDocument();
  });

  it('displays LogoText with correct props', () => {
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget onOpenChat={mockOnOpenChat} size={60} />
      </TestWrapper>
    );

    const logoText = screen.getByTestId('logo-text');
    expect(logoText).toHaveTextContent('Size: small');
    expect(logoText).toHaveTextContent('BubbleOnly: true');
    expect(logoText).toHaveTextContent('Animated: false');
  });

  it('calls onOpenChat when clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget onOpenChat={mockOnOpenChat} />
      </TestWrapper>
    );

    const beeButton = screen.getByRole('button', { name: 'Open AgentHive chat assistant' });
    await user.click(beeButton);

    expect(mockOnOpenChat).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation (Enter key)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget onOpenChat={mockOnOpenChat} />
      </TestWrapper>
    );

    const beeButton = screen.getByRole('button', { name: 'Open AgentHive chat assistant' });
    beeButton.focus();
    await user.keyboard('{Enter}');

    expect(mockOnOpenChat).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation (Space key)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget onOpenChat={mockOnOpenChat} />
      </TestWrapper>
    );

    const beeButton = screen.getByRole('button', { name: 'Open AgentHive chat assistant' });
    beeButton.focus();
    await user.keyboard(' ');

    expect(mockOnOpenChat).toHaveBeenCalledTimes(1);
  });

  it('shows message bubble after interval', async () => {
    const messages = ['Test message 1', 'Test message 2'];
    
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget 
          onOpenChat={mockOnOpenChat}
          messages={messages}
          messageInterval={1000}
          pauseDuration={500}
        />
      </TestWrapper>
    );

    // Initially no bubble
    expect(screen.queryByText('Test message 1')).not.toBeInTheDocument();

    // Advance time to trigger message
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
    });
  });

  it('hides message bubble after pause duration', async () => {
    const messages = ['Test message 1'];
    
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget 
          onOpenChat={mockOnOpenChat}
          messages={messages}
          messageInterval={1000}
          pauseDuration={500}
        />
      </TestWrapper>
    );

    // Trigger message display
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
    });

    // Advance time to hide message
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test message 1')).not.toBeInTheDocument();
    });
  });

  it('cycles through messages', async () => {
    const messages = ['Message 1', 'Message 2', 'Message 3'];
    
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget 
          onOpenChat={mockOnOpenChat}
          messages={messages}
          messageInterval={1000}
          pauseDuration={100}
        />
      </TestWrapper>
    );

    // First message
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() => expect(screen.getByText('Message 1')).toBeInTheDocument());

    // Hide first message and show second
    act(() => {
      jest.advanceTimersByTime(1100); // 100ms pause + 1000ms interval
    });
    await waitFor(() => expect(screen.getByText('Message 2')).toBeInTheDocument());

    // Hide second message and show third
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => expect(screen.getByText('Message 3')).toBeInTheDocument());
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget onOpenChat={mockOnOpenChat} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: 'Open AgentHive chat assistant' });
    expect(button).toHaveAttribute('tabIndex', '0');
    expect(button).toHaveAttribute('role', 'button');
    expect(button).toHaveAttribute('aria-label', 'Open AgentHive chat assistant');
  });

  it('respects custom size prop', () => {
    render(
      <TestWrapper>
        <AgentHiveFloatingWidget onOpenChat={mockOnOpenChat} size={80} />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ width: '80px', height: '80px' });
  });

  it('does not render on mobile devices', () => {
    // Mock mobile breakpoint
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('(max-width: 959.95px)'), // md breakpoint
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <TestWrapper>
        <AgentHiveFloatingWidget onOpenChat={mockOnOpenChat} />
      </TestWrapper>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
