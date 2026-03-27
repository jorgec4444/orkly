export const toastConfig = {
  position: 'bottom-center',
  reverseOrder: false,
  toastOptions: {
    duration: 3000,
    style: {
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500',
      padding: '12px 16px',
    },
    success: {
      style: {
        background: '#0F6E56',
        color: '#ffffff',
        border: '1px solid #1D9E75',
      },
      iconTheme: { primary: '#ffffff', secondary: '#0F6E56' },
    },
    error: {
      style: {
        background: '#fef2f2',
        color: '#DC2626',
        border: '1px solid #fecaca',
      },
      iconTheme: { primary: '#DC2626', secondary: '#fef2f2' },
    },
  },
}