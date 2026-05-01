import { HttpInterceptorFn } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = Date.now();
  console.log(`[HTTP] ${req.method} ${req.url}`);

  return next(req).pipe(
    tap((event) => {
      const elapsed = Date.now() - start;
      console.log(`[HTTP] ${req.url} — ${elapsed}ms`);
    }),
    catchError((error) => {
      const elapsed = Date.now() - start;
      console.error(`[HTTP] ${req.url} — ${elapsed}ms — Error ${error.status}`);
      return throwError(() => error);
    }),
  );
};
