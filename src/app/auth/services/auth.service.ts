import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {catchError, tap} from "rxjs/operators";
import {BehaviorSubject, Subject, throwError} from "rxjs";
import {User} from "../user.model";
import {Router} from "@angular/router";


/*
idToken	string	A Firebase Auth ID token for the newly created user.
email	string	The email for the newly created user.
refreshToken	string	A Firebase Auth refresh token for the newly created user.
expiresIn	string	The number of seconds in which the ID token expires.
localId	string	The uid of the newly created user.
* */
export interface AuthResponseData {
    idToken: string,
    email: string,
    refreshToken: string,
    expiresIn: string,
    localId: string,
    registered?: boolean
}

@Injectable({providedIn: 'root'})
export class AuthService {

    // @ts-ignore
    user$ = new BehaviorSubject<User|null>(null);
    private storageUserKey = 'userData';

    constructor(private httpClient: HttpClient,private router:Router) {
    }

    signup(email: string, password: string) {
        return this.httpClient.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBKklu_He8ReMEJsIrhkG61IpOX8HMbdPY',
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
        ).pipe(
            catchError(this.handleError),
            tap(x => {
                this.handleAuthentication(x.email, x.localId, x.idToken, +x.expiresIn);
            })
        );
    }

    login(email: string, password: string) {
        return this.httpClient.post<AuthResponseData>("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBKklu_He8ReMEJsIrhkG61IpOX8HMbdPY",
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
        ).pipe(
            catchError(this.handleError),
            tap(x => {
                this.handleAuthentication(x.email, x.localId, x.idToken, +x.expiresIn);
            })
        );

    }

    autoLogin() {
        // const stringUserData = localStorage.getItem(this.storageUserKey);
        // if (!stringUserData) {
        //     return;
        // }
        // const loadedUser:User = JSON.parse(stringUserData);
        // if (loadedUser.isTokenNotExpired()) {
        //     this.user$.next(loadedUser);
        // }

        // Z jakiegoś powodu to pierwsze podejście nie działa
        // nie mam pojecia dlacszego
        const userData: {
            email: string;
            id: string;
            _token: string;
            _tokenExpirationDate: string;
        } = JSON.parse(<string>localStorage.getItem('userData'));
        if (!userData) {
            return;
        }
        const loadedUser = new User(
            userData.email,
            userData.id,
            userData._token,
            new Date(userData._tokenExpirationDate)
        );
        if (loadedUser.token) {
            this.user$.next(loadedUser);
        }
    }


    private handleAuthentication(email: string, userId: string, token: string, expirationTime: number) {
        const expirationDate = new Date(new Date().getTime() + expirationTime * 1000)
        const user = new User(email, userId, token, expirationDate);
        this.user$.next(user);
        localStorage.setItem(this.storageUserKey, JSON.stringify(user));
    }

    private handleError(errorResponse: HttpErrorResponse) {
        let errorMessage = "an unknown error has occurred"
        if (!errorResponse.error || !errorResponse.error.error) {
            return throwError(errorMessage);
        }
        switch (errorResponse.error.error.message) {
            case 'EMAIL_EXISTS':
                errorMessage = "Email exist";
                break;
            case 'EMAIL_NOT_FOUND':
                errorMessage = "Email not found";
                break;
            case 'INVALID_PASSWORD':
                errorMessage = "Password in invalid";
                break;
            case 'USER_DISABLED':
                errorMessage = "User is disabled by administrator";
                break;
        }
        return throwError(errorMessage);
    }

    logout() {
        this.user$.next(null);
        this.router.navigate(['/auth']);
    }
}


//     EMAIL_NOT_FOUND: There is no user record corresponding to this identifier. The user may have been deleted.
//     INVALID_PASSWORD: The password is invalid or the user does not have a password.
//     USER_DISABLED: The user account has been disabled by an administrator.
