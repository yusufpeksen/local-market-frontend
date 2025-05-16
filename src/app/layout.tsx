import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/carousel/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: 9,
  fontFamily: inter.style.fontFamily,
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
      },
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MantineProvider theme={theme}>
          <Notifications position="bottom-right" />
          <Navbar />
          <main style={{ paddingTop: '60px' }}>
        {children}
          </main>
        </MantineProvider>
      </body>
    </html>
  );
}
