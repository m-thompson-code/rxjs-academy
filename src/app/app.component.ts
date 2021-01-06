import { Component, OnInit } from '@angular/core';

import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

const getCleanCardNumber = (cardNumber: string): string => {
    return (cardNumber || '').replace(/[\s-]/g, "");
}

@Component({
    selector: 'moo-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    public userCardNumber!: BehaviorSubject<string>;
    public cardNumber!: Observable<string>;
    private _sub!: Subscription;

    public ngOnInit(): void {
        this._sub = new Subscription();

        this.userCardNumber = new BehaviorSubject<string>('');

        const mapToCleanCardNumber = map(getCleanCardNumber);

        this.cardNumber = this.userCardNumber.pipe(mapToCleanCardNumber);
    }

    public handleFakeNumberInput(event: Event): void {
        const _target = event.target as HTMLInputElement | null;
        this.userCardNumber.next( _target?.value || '' );
    }

    public ngOnDestroy(): void {
        this._sub.unsubscribe();
    }
}
