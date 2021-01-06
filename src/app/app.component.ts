import { Component, OnInit } from '@angular/core';

import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

const getCleanCardNumber = (cardNumber: string): string => {
    return (cardNumber || '').replace(/[\s-]/g, "");
}

const isEmpty = (value: any): boolean => {
    return !value;
}

const hasLengthOf = (str: string, expectedLength: number): boolean => {
    return (str || '').length === expectedLength;
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

        this.cardNumber = this.userCardNumber.pipe(mapCleanCardNumber);

        const mapCardError = map((cardNumber: string) => {
            if (isEmpty(cardNumber)) {
                return 'user has not entered a card';
            }

            if (!hasLengthOf(cardNumber, 16)) {
                return 'the card number is not 16 digits';
            }

            return '';
        });

        this.cardError = this.userCardNumber.pipe(mapCardError);
    }

    public handleFakeNumberInput(event: Event): void {
        const _target = event.target as HTMLInputElement | null;
        this.userCardNumber.next( _target?.value || '' );
    }

    public ngOnDestroy(): void {
        this._sub.unsubscribe();
    }
}
