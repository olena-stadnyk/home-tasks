import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ToastProvider } from './shared/ui/Toast';
import { requestPersistentStorage } from './data/persist';
import './styles.css';

void requestPersistentStorage();

// Без StrictMode: подвійний запуск ефектів у dev ламає роботу Sheet з історією (кнопка «Назад»).
createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
);
