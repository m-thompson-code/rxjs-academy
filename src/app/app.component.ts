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

interface CardNumberState {
    errorMessage: string;
    blurredOnce: boolean;
}

const getCleanCardNumber = (cardNumber: string): string => {
    return (cardNumber || '').replace(/[\s-]/g, "");
}

const getExpiryArray = (expiry: string): string[] => {
    const _expiry = (expiry || '').replace(/[\s-]/g, "");

    return [
        _expiry.slice(0, 2),
        _expiry.slice(2),
    ];
}

// TODO: what makes a cvc clean
const getCleanCVC = (cvc: string): string => {
    return (cvc || '').replace(/[\s-]/g, "");
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
    private _sub!: Subscription;// Just for quick testing

    public cardNumberBlurredOnce!: BehaviorSubject<boolean>;
    public expiryBlurredOnce!: BehaviorSubject<boolean>;
    public cvcBlurredOnce!: BehaviorSubject<boolean>;

    public userCardNumber!: BehaviorSubject<string>;
    public userExpiry!: BehaviorSubject<string>;
    public userCVC!: BehaviorSubject<string>;

    public cardNumber!: Observable<string>;
    public expiry!: Observable<string[]>;
    public cvc!: Observable<string>;

    public cardNumberError!: Observable<string>;
    public expiryError!: Observable<string>;
    public cvcError!: Observable<string>;

    public showCardNumberError!: Observable<boolean>;
    public showExpiryError!: Observable<boolean>;
    public showCVCError!: Observable<boolean>;

    public ngOnInit(): void {
        this._sub = new Subscription();// Used to collect subscriptions so we can unsubscribe them all later if needed

        this.cardNumberBlurredOnce = new BehaviorSubject<boolean>(false);
        this.expiryBlurredOnce = new BehaviorSubject<boolean>(false);
        this.cvcBlurredOnce = new BehaviorSubject<boolean>(false);



        this.userCardNumber = new BehaviorSubject<string>('');
        this.userExpiry = new BehaviorSubject<string>('');
        this.userCVC = new BehaviorSubject<string>('');



        const mapCleanCardNumber = map(getCleanCardNumber);
        this.cardNumber = this.userCardNumber.pipe(mapCleanCardNumber);

        const mapExpiryArray = map(getExpiryArray);
        this.expiry = this.userExpiry.pipe(mapExpiryArray);

        const mapCleanCVC = map(getCleanCVC);
        this.cvc = this.userCVC.pipe(mapCleanCVC);



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

            if (!hasLengthOf(expiry[0], 2) || !hasLengthOf(expiry[1], 2)) {
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

        const cardNumberAccumulator = (acc: CardNumberState, current: ErrorMessageEvent | BlurredOnceEvent): CardNumberState => {
            if (current.type === 'errorMessage') {
                return {...acc, errorMessage: current.value};
            }

            if (current.type === 'blurredOnce') {
                return {...acc, blurredOnce: current.value};
            }

            return acc;
        }

        const cardNumberSeed = {errorMessage: '', blurredOnce: false};

        const cardNumberState = merge(cardNumberErrorMessageEvent, cardNumberBlurredOnceEvent).pipe(scan<ErrorMessageEvent | BlurredOnceEvent, CardNumberState>(cardNumberAccumulator, cardNumberSeed));

        this.showCardNumberError = cardNumberState.pipe(map<CardNumberState, boolean>(value => {
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

        // const expiryAccumulator = (acc: CardNumberState, current: ErrorMessageEvent | BlurredOnceEvent): CardNumberState => {
        //     if (current.type === 'errorMessage') {
        //         return {...acc, errorMessage: current.value};
        //     }

        //     if (current.type === 'blurredOnce') {
        //         return {...acc, blurredOnce: current.value};
        //     }

        //     return acc;
        // }

        // const expirySeed = {errorMessage: '', blurredOnce: false};

        const expiryState = merge(expiryErrorMessageEvent, expiryBlurredOnceEvent).pipe(scan<ErrorMessageEvent | BlurredOnceEvent, CardNumberState>(cardNumberAccumulator, cardNumberSeed));

        this.showExpiryError = expiryState.pipe(map<CardNumberState, boolean>(value => {
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

        // const cvcAccumulator = (acc: CardNumberState, current: ErrorMessageEvent | BlurredOnceEvent): CardNumberState => {
        //     if (current.type === 'errorMessage') {
        //         return {...acc, errorMessage: current.value};
        //     }

        //     if (current.type === 'blurredOnce') {
        //         return {...acc, blurredOnce: current.value};
        //     }

        //     return acc;
        // }

        // const cvcSeed = {errorMessage: '', blurredOnce: false};

        const cvcState = merge(cvcErrorMessageEvent, cvcBlurredOnceEvent).pipe(scan<ErrorMessageEvent | BlurredOnceEvent, CardNumberState>(cardNumberAccumulator, cardNumberSeed));

        this.showCVCError = cvcState.pipe(map<CardNumberState, boolean>(value => {
            return !!value.errorMessage && value.blurredOnce;
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

    public ngOnDestroy(): void {
        this._sub.unsubscribe();
    }
}
