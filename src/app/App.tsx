import { useRoute } from './router';
import { TasksPage } from '../features/tasks/TasksPage';

export function App() {
  const route = useRoute();
  // Розділи застосунку. Tracker з'явиться тут окремим case, коли буде готовий.
  switch (route.section) {
    case 'tasks':
      return <TasksPage list={route.list} />;
  }
}
