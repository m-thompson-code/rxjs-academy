import { Component, OnInit } from '@angular/core';
import { resolve } from 'dns';

import { BehaviorSubject, Observable, merge, Subscription, combineLatest } from 'rxjs';
import { map, tap, scan, withLatestFrom } from 'rxjs/operators';

interface ErrorMessageEvent {
    type: 'errorMessage';
    value: string;
}

interface BlurredOnceEvent {
    type: 'blurredOnce';
    value: boolean;
}

interface InputState {
    errorMessage: string;
    blurredOnce: boolean;
}

const getCleanCardNumber = (cardNumber: string): string => {
    return (cardNumber || '').replace(/[\s-]/g, "");
}

const getExpiryArray = (expiry: string): string[] => {
    return expiry.split('-');
}


const isEmpty = (value: any): boolean => {
    return !value;
}

const hasLengthOf = (str: string, expectedLength: number): boolean => {
    return (str || '').length === expectedLength;
}



// const log = (label: string): MonoTypeOperatorFunction<any> => {
//     return tap({
//         next: value => {
//             console.log('next', label, value);
//         },
//         error: err => {
//             console.log('error', label, err);
//         },
//         complete: () => {
//             console.log('complete', label);
//         }
//     });
// }

@Component({
    selector: 'moo-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    private _sub!: Subscription;

    public cardNumberBlurredOnce = new BehaviorSubject<boolean>(false);
    public expiryBlurredOnce = new BehaviorSubject<boolean>(false);
    public cvcBlurredOnce = new BehaviorSubject<boolean>(false);

    public userCardNumber = new BehaviorSubject<string>('');
    public userExpiry = new BehaviorSubject<string>('');
    public userCVC = new BehaviorSubject<string>('');

    public cardNumber!: Observable<string>;
    public expiry!: Observable<string[]>;
    public cvc!: Observable<string>;

    public cardNumberError!: Observable<string>;
    public expiryError!: Observable<string>;
    public cvcError!: Observable<string>;

    public showCardNumberError!: Observable<boolean>;
    public showExpiryError!: Observable<boolean>;
    public showCVCError!: Observable<boolean>;

    public isCardInvalid!: Observable<boolean>;

    public paySubmitted = new BehaviorSubject<boolean>(false);

    public ngOnInit(): void {
        this._sub = new Subscription();// Used to collect subscriptions so we can unsubscribe them all later if needed

        const mapCleanCardNumber = map(getCleanCardNumber);
        this.cardNumber = this.userCardNumber.pipe(mapCleanCardNumber);

        const mapExpiryArray = map(getExpiryArray);
        this.expiry = this.userExpiry.pipe(mapExpiryArray);

        // No clean up on cvc, just going to make reference to userCVC Observable
        this.cvc = this.userCVC;


        const mapCardNumberError = map((cardNumber: string) => {
            if (isEmpty(cardNumber)) {
                return 'There is no card number';
            }

            if (!hasLengthOf(cardNumber, 16)) {
                return 'There should be 16 characters in a card number';
            }

            return '';
        });

        const mapExpiryError = map((expiry: string[]) => {
            if (isEmpty(expiry[0] || expiry[1])) {
                return 'There is no expiry. Format  MM-YY';
            }

            if (expiry.length !== 2 || !hasLengthOf(expiry[0], 2) || !hasLengthOf(expiry[1], 2)) {
                return 'Expiry must be formatted like MM-YY';
            }

            return '';
        });

        const mapCVCError = map((cvc: string) => {
            if (isEmpty(cvc)) {
                return 'There is no CVC code';
            }

            if (!hasLengthOf(cvc, 3)) {
                // Reword from 'The CVC must be at least 3 numbers' to must be 3 numbers
                return 'The CVC must be 3 numbers';
            }

            if (isNaN(parseInt(cvc))) {
                return "The CVC must be numbers";
            }

            return '';
        });

        this.cardNumberError = this.cardNumber.pipe(mapCardNumberError);
        this.expiryError = this.expiry.pipe(mapExpiryError);
        this.cvcError = this.cvc.pipe(mapCVCError);



        // accumulator and seed is shared between cardNumber, expiry, and cvc
        const accumulator = (acc: InputState, current: ErrorMessageEvent | BlurredOnceEvent): InputState => {
            if (current.type === 'errorMessage') {
                return {...acc, errorMessage: current.value};
            }

            if (current.type === 'blurredOnce') {
                return {...acc, blurredOnce: current.value};
            }

            return acc;
        }

        const seed = {errorMessage: '', blurredOnce: false};


        const cardNumberErrorMessageEvent = this.cardNumberError.pipe(map<string, ErrorMessageEvent>(errorMessage => {
            return {
                type: 'errorMessage',
                value: errorMessage,
            };
        }));

        const cardNumberBlurredOnceEvent = this.cardNumberBlurredOnce.pipe(map<boolean, BlurredOnceEvent>(blurredOnce => {
            return {
                type: 'blurredOnce',
                value: blurredOnce,
            }
        }));

        const cardNumberState = merge(cardNumberErrorMessageEvent, cardNumberBlurredOnceEvent).pipe(scan<ErrorMessageEvent | BlurredOnceEvent, InputState>(accumulator, seed));

        this.showCardNumberError = cardNumberState.pipe(map<InputState, boolean>(value => {
            return !!value.errorMessage && value.blurredOnce;
        }));

        
        const expiryErrorMessageEvent = this.expiryError.pipe(map<string, ErrorMessageEvent>(errorMessage => {
            return {
                type: 'errorMessage',
                value: errorMessage,
            };
        }));

        const expiryBlurredOnceEvent = this.expiryBlurredOnce.pipe(map<boolean, BlurredOnceEvent>(blurredOnce => {
            return {
                type: 'blurredOnce',
                value: blurredOnce,
            }
        }));

        const expiryState = merge(expiryErrorMessageEvent, expiryBlurredOnceEvent).pipe(scan<ErrorMessageEvent | BlurredOnceEvent, InputState>(accumulator, seed));

        this.showExpiryError = expiryState.pipe(map<InputState, boolean>(value => {
            return !!value.errorMessage && value.blurredOnce;
        }));

        
        const cvcErrorMessageEvent = this.cvcError.pipe(map<string, ErrorMessageEvent>(errorMessage => {
            return {
                type: 'errorMessage',
                value: errorMessage,
            };
        }));

        const cvcBlurredOnceEvent = this.cvcBlurredOnce.pipe(map<boolean, BlurredOnceEvent>(blurredOnce => {
            return {
                type: 'blurredOnce',
                value: blurredOnce,
            }
        }));

        const cvcState = merge(cvcErrorMessageEvent, cvcBlurredOnceEvent).pipe(scan<ErrorMessageEvent | BlurredOnceEvent, InputState>(accumulator, seed));

        this.showCVCError = cvcState.pipe(map<InputState, boolean>(value => {
            return !!value.errorMessage && value.blurredOnce;
        }));

        this.isCardInvalid = combineLatest([this.cardNumberError, this.expiryError, this.cvcError]).pipe(map(values => {
            return values.some(showError => !!showError);
        }));

        const combineCard = (cardNumber: Observable<string>, expiry: Observable<string[]>, cvc: Observable<string>) => {
            return combineLatest([
                cardNumber, 
                expiry, 
                cvc, 
                // (cardNumber: Observable<string>, expiry: Observable<string[]>, cvc: Observable<string>)=>{cardNumber, expiry, cvc},
            ]);
        };

        const paymentPromises = (paySubmitted: BehaviorSubject<boolean>, card: Observable<any>) => {
            return paySubmitted.pipe(withLatestFrom(card)).pipe(map(_card => {
                console.log("Asking for token with", _card);

                return new Promise<number>(resolve => {
                    setTimeout(() => {
                        resolve(1000);
                    }, 2000);
                });
            }));
        };

        const card = combineCard(this.cardNumber, this.expiry, this.cvc);

        const payments: Observable<Promise<number>> = paymentPromises(this.paySubmitted, card);

        this._sub.add(payments.subscribe(paymentPromise => {
            paymentPromise.then(() => {
                console.log("payment complete!");
            });
        }));
    }

    public handleCardNumberInput(event: Event): void {
        const _target = event.target as HTMLInputElement | null;
        this.userCardNumber.next( _target?.value || '' );
    }
    
    public handleExpiryInput(event: Event): void {
        const _target = event.target as HTMLInputElement | null;
        this.userExpiry.next( _target?.value || '' );
    }
    
    public handleCVCInput(event: Event): void {
        const _target = event.target as HTMLInputElement | null;
        this.userCVC.next( _target?.value || '' );
    }

    public pay(event: Event): void {
        event.preventDefault();
        this.paySubmitted.next(true);
    }

    public ngOnDestroy(): void {
        this._sub.unsubscribe();
    }
}
