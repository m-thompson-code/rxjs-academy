import { Component, OnInit } from '@angular/core';

import { BehaviorSubject, MonoTypeOperatorFunction, Observable, Subject, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

const getCleanCardNumber = (cardNumber: string): string => {
    return (cardNumber || '').replace(/[\s-]/g, "");
}

const isEmpty = (value: any): boolean => {
    return !value;
}

const hasLengthOf = (str: string, expectedLength: number): boolean => {
    return (str || '').length === expectedLength;
}

const log = (label: string): MonoTypeOperatorFunction<any> => {
    return tap({
        next: value => {
            console.log('next', label, value);
        },
        error: err => {
            console.log('error', label, err);
        },
        complete: () => {
            console.log('complete', label);
        }
    });
}

@Component({
    selector: 'moo-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public userCardNumber!: BehaviorSubject<string>;
    public cardNumber!: Observable<string>;
    public cardError!: Observable<string>;
    private _sub!: Subscription;

    public ngOnInit(): void {
        this._sub = new Subscription();

        this.userCardNumber = new BehaviorSubject<string>('');

        const mapCleanCardNumber = map(getCleanCardNumber);

        // Note that tap will execute 3 times (once for userCardNumber.pipe, once for cardError.pipe, once for the async pipe being used on the page)
        this.cardNumber = this.userCardNumber.pipe(mapCleanCardNumber).pipe(log('number'));

        const mapCardError = map((cardNumber: string) => {
            if (isEmpty(cardNumber)) {
                return 'user has not entered a card';
            }

            if (!hasLengthOf(cardNumber, 16)) {
                return 'the card number is not 16 digits';
            }

            return '';
        });

        this.cardError = this.cardNumber.pipe(mapCardError);
    }

    public handleFakeNumberInput(event: Event): void {
        const _target = event.target as HTMLInputElement | null;
        this.userCardNumber.next( _target?.value || '' );
    }

    public ngOnDestroy(): void {
        this._sub.unsubscribe();
    }
}
