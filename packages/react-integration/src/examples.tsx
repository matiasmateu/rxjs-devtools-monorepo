// Example usage patterns for RxJS DevTools React integration

import  { useEffect, useState } from 'react';
import { interval, fromEvent, map, debounceTime } from 'rxjs';
import {
  useRxJSDevTools,
  useTrackedObservable,
  useObservableFactory,
  trackObservable,
  withTracking,
} from './index';

// Example 1: Basic setup in root component
export function App() {
  // Initialize DevTools once in your root component
  useRxJSDevTools({
    name: 'My React App',
    enabled: process.env.NODE_ENV === 'development',
  });

  return (
    <div>
      <TimerComponent />
      <SearchComponent />
      <ServiceExample />
    </div>
  );
}

// Example 2: Using the useTrackedObservable hook
export function TimerComponent() {
  const timer$ = useTrackedObservable(
    () => interval(1000).pipe(map(n => `Timer: ${n}`)),
    'Timer Stream'
  );

  const [timerValue, setTimerValue] = useState<string>('');

  useEffect(() => {
    const subscription = timer$.subscribe(setTimerValue);
    return () => subscription.unsubscribe();
  }, [timer$]);

  return <div>{timerValue}</div>;
}

// Example 3: Using useObservableFactory for dynamic observables
export function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchResults$ = useObservableFactory(
    () => {
      if (!searchTerm) return interval(1000).pipe(map(() => ''));
      return fromEvent(document, 'keyup').pipe(
        debounceTime(300),
        map(() => `Search results for: ${searchTerm}`)
      );
    },
    [searchTerm],
    'Search Results Stream'
  );

  const [results, setResults] = useState<string>('');

  useEffect(() => {
    const subscription = searchResults$.subscribe(setResults);
    return () => subscription.unsubscribe();
  }, [searchResults$]);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      <div>{results}</div>
    </div>
  );
}

// Example 4: Using trackObservable utility function
export function UtilityExample() {
  useEffect(() => {
    // Track any observable directly
    const clicks$ = trackObservable(
      fromEvent(document, 'click'),
      'Document Clicks'
    );

    const subscription = clicks$.subscribe(event => {
      console.log('Click detected:', event);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <div>Click anywhere to see events in DevTools</div>;
}

// Example 5: Using the decorator pattern
class DataService {
  // getUserData and getNotifications without decorators
  getUserData() {
    return interval(2000).pipe(
      map(n => ({ id: n, name: `User ${n}` }))
    );
  }

  getNotifications() {
    return interval(5000).pipe(
      map(n => `Notification ${n}`)
    );
  }
}

// Example 6: Using withTracking higher-order function
const createUserStream = withTracking(
  (userId: number) => {
    return interval(1000).pipe(
      map(n => ({ userId, data: `Data ${n}` }))
    );
  },
  'User Stream Factory'
);

export function ServiceExample() {
  const [userData, setUserData] = useState<any>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const service = new DataService();
    
    const userSub = service.getUserData().subscribe(setUserData);
    const notifSub = service.getNotifications().subscribe(notif => {
      setNotifications(prev => [...prev, notif].slice(-5));
    });

    // Using the wrapped function
    const userStreamSub = createUserStream(123).subscribe(data => {
      console.log('User stream data:', data);
    });

    return () => {
      userSub.unsubscribe();
      notifSub.unsubscribe();
      userStreamSub.unsubscribe();
    };
  }, []);

  return (
    <div>
      <h3>User Data:</h3>
      <pre>{JSON.stringify(userData, null, 2)}</pre>
      
      <h3>Notifications:</h3>
      <ul>
        {notifications.map((notif, i) => (
          <li key={i}>{notif}</li>
        ))}
      </ul>
    </div>
  );
}

// Example 7: Auto-initialization usage
// In your main app file, you can use auto-initialization:
/*
import 'rxjs-devtools/auto';
// or
import { rxjsDevTools } from 'rxjs-devtools/auto';

// DevTools will be automatically initialized and ready to use
*/

// Example 8: Manual initialization with custom options
/*
import { initializeRxJSDevTools } from 'rxjs-devtools';

initializeRxJSDevTools({
  name: 'My Custom App',
  enabled: true, // Force enable even in production
  logObservables: true,
  maxRetries: 100,
  retryInterval: 1000,
});
*/

