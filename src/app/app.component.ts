import { Component, OnInit } from '@angular/core';

import { BehaviorSubject, MonoTypeOperatorFunction, Observable, merge, Subscription } from 'rxjs';
import { map, tap, scan } from 'rxjs/operators';

interface ErrorMessageEvent {
    type: 'errorMessage';
    value: string;
}

interface BlurredOnceEvent {
    type: 'blurredOnce';
    value: boolean;
}

interface FakeNumberState {
    errorMessage: string;
    blurredOnce: boolean;
}

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

    public fakeNumberBlurredOnce!: BehaviorSubject<boolean>;
    public showCardError!: Observable<boolean>;

    public ngOnInit(): void {
        this._sub = new Subscription();// Used to collect subscriptions so we can unsubscribe them all later if needed

        this.fakeNumberBlurredOnce = new BehaviorSubject<boolean>(false);

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

        const errorMessageEvent = this.cardError.pipe(map<string, ErrorMessageEvent>(errorMessage => {
            return {
                type: 'errorMessage',
                value: errorMessage,
            };
        }));

        const blurredOnceEvent = this.fakeNumberBlurredOnce.pipe(map<boolean, BlurredOnceEvent>(blurredOnce => {
            return {
                type: 'blurredOnce',
                value: blurredOnce,
            }
        }));

        const accumulator = (acc: FakeNumberState, current: ErrorMessageEvent | BlurredOnceEvent): FakeNumberState => {
            if (current.type === 'errorMessage') {
                return {...acc, errorMessage: current.value};
            }

            if (current.type === 'blurredOnce') {
                return {...acc, blurredOnce: current.value};
            }

            return acc;
        }

        const seed = {errorMessage: '', blurredOnce: false};

        const fakeNumberState = merge(errorMessageEvent, blurredOnceEvent).pipe(scan<ErrorMessageEvent | BlurredOnceEvent, FakeNumberState>(accumulator, seed));

        this.showCardError = fakeNumberState.pipe(map<FakeNumberState, boolean>(value => {
            return !!value.errorMessage && value.blurredOnce;
        }));
    }

    public handleFakeNumberInput(event: Event): void {
        const _target = event.target as HTMLInputElement | null;
        this.userCardNumber.next( _target?.value || '' );
    }

    public ngOnDestroy(): void {
        this._sub.unsubscribe();
    }
}
