import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

interface IconProps {
  color: string;
  size?: number;
}

export function HomeIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 192 192">
      <Path
        d="M34.4 88 L34.4 145.6 Q34.4 152 40.8 152 L151.2 152 Q157.6 152 157.6 145.6 L157.6 88 L101.6 36.8 Q96 32 90.4 36.8 Z"
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M80 152 L80 122.4 Q80 107.2 96 107.2 Q112 107.2 112 122.4 L112 152"
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PhotoIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 192 192">
      <Rect
        x={28}
        y={28}
        width={136}
        height={136}
        rx={40}
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={96} cy={96} r={34.4} fill="none" stroke={color} strokeWidth={16} />
      <Circle cx={133.6} cy={58.4} r={8.4} fill={color} />
    </Svg>
  );
}

export function RecordsIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 192 192">
      <Line x1={72} y1={52} x2={152} y2={52} stroke={color} strokeWidth={16} strokeLinecap="round" />
      <Line x1={72} y1={96} x2={152} y2={96} stroke={color} strokeWidth={16} strokeLinecap="round" />
      <Line x1={72} y1={140} x2={152} y2={140} stroke={color} strokeWidth={16} strokeLinecap="round" />
      <Circle cx={41.6} cy={52} r={9.2} fill={color} />
      <Circle cx={41.6} cy={96} r={9.2} fill={color} />
      <Circle cx={41.6} cy={140} r={9.2} fill={color} />
    </Svg>
  );
}

const DOG_BODY =
  'M 603 276 L 589 286 L 568 307 L 561 316 L 560 319 L 561 325 L 567 329 L 572 328 L 584 314 L 603 296 L 616 288 L 630 284 L 631 285 L 641 286 L 654 291 L 692 311 L 713 325 L 727 337 L 731 342 L 734 349 L 734 360 L 729 373 L 719 387 L 705 400 L 690 409 L 683 411 L 676 411 L 670 409 L 661 401 L 653 388 L 644 369 L 634 340 L 631 323 L 629 318 L 626 315 L 619 315 L 615 319 L 614 328 L 617 344 L 627 377 L 634 391 L 634 393 L 644 411 L 657 426 L 670 432 L 685 432 L 695 429 L 707 423 L 717 416 L 730 404 L 740 392 L 747 381 L 752 369 L 754 360 L 754 350 L 752 342 L 745 330 L 735 320 L 714 305 L 683 287 L 656 274 L 640 269 L 627 268 L 626 269 L 616 270 Z M 384 274 L 374 270 L 364 269 L 363 268 L 350 269 L 337 273 L 318 282 L 280 304 L 255 322 L 246 332 L 241 341 L 239 348 L 239 360 L 242 372 L 248 384 L 257 397 L 270 411 L 280 419 L 293 427 L 307 432 L 323 432 L 335 426 L 346 414 L 360 389 L 367 371 L 373 349 L 375 333 L 376 332 L 376 320 L 371 315 L 365 315 L 360 320 L 356 343 L 348 368 L 338 390 L 331 401 L 325 407 L 316 411 L 305 410 L 298 407 L 286 399 L 272 385 L 266 377 L 260 365 L 258 353 L 259 352 L 259 347 L 262 341 L 273 330 L 303 310 L 342 289 L 353 285 L 359 285 L 360 284 L 370 286 L 384 293 L 402 308 L 417 326 L 420 328 L 424 329 L 430 326 L 432 320 L 431 317 L 421 304 L 402 286 Z M 441 458 L 441 465 L 445 472 L 454 480 L 466 484 L 481 483 L 492 478 L 495 475 L 500 479 L 507 482 L 515 484 L 525 484 L 539 479 L 545 474 L 551 464 L 551 459 L 547 454 L 540 454 L 536 462 L 530 468 L 521 471 L 510 469 L 502 461 L 502 454 L 509 448 L 510 440 L 506 434 L 499 431 L 489 432 L 485 434 L 482 438 L 481 442 L 482 446 L 490 455 L 490 461 L 486 466 L 479 470 L 470 471 L 462 468 L 457 464 L 454 460 L 453 456 L 450 454 L 445 454 Z';

const DOG_EYES =
  'M 411 393 L 404 395 L 396 402 L 393 408 L 393 413 L 392 414 L 394 423 L 400 431 L 409 435 L 418 435 L 426 431 L 431 426 L 434 419 L 434 409 L 432 404 L 426 397 L 420 394 Z M 570 394 L 566 396 L 560 402 L 556 412 L 557 421 L 564 431 L 573 435 L 582 435 L 587 433 L 594 427 L 598 416 L 597 407 L 593 400 L 584 394 L 580 393 Z';

const CAT_BODY =
  'M 181 397 L 174 390 L 163 391 L 141 397 L 115 409 L 110 414 L 110 422 L 115 427 L 118 428 L 124 427 L 130 423 L 146 416 L 166 410 L 175 409 L 180 404 Z M 509 396 L 509 401 L 514 407 L 526 409 L 548 416 L 566 425 L 574 425 L 579 419 L 579 412 L 575 407 L 563 401 L 544 394 L 524 389 L 515 389 L 511 392 Z M 478 363 L 471 368 L 469 374 L 470 379 L 474 384 L 478 386 L 484 386 L 491 381 L 493 376 L 492 369 L 487 364 Z M 207 363 L 201 367 L 199 371 L 199 378 L 201 382 L 205 385 L 213 386 L 220 381 L 222 377 L 222 372 L 221 369 L 216 364 Z M 516 360 L 518 366 L 523 370 L 532 370 L 533 369 L 551 368 L 552 367 L 570 367 L 571 368 L 592 369 L 597 365 L 598 356 L 594 351 L 587 349 L 547 348 L 546 349 L 523 351 L 518 355 Z M 90 359 L 92 366 L 99 370 L 109 369 L 110 368 L 121 368 L 122 367 L 138 367 L 139 368 L 150 368 L 158 370 L 167 370 L 173 365 L 174 362 L 173 356 L 169 352 L 155 349 L 147 349 L 146 348 L 116 348 L 115 349 L 99 350 L 94 352 Z M 276 372 L 276 378 L 280 386 L 289 396 L 300 402 L 313 405 L 330 402 L 341 396 L 346 391 L 356 399 L 369 404 L 380 405 L 390 403 L 403 396 L 410 389 L 416 379 L 415 369 L 409 365 L 404 365 L 398 370 L 395 377 L 386 384 L 372 385 L 365 382 L 359 376 L 357 372 L 357 367 L 361 364 L 365 358 L 366 346 L 362 340 L 354 336 L 340 336 L 333 338 L 328 342 L 325 349 L 326 355 L 329 361 L 336 368 L 336 371 L 332 378 L 323 384 L 309 385 L 304 383 L 298 378 L 294 369 L 288 365 L 283 365 L 279 367 Z M 546 90 L 532 95 L 515 104 L 499 114 L 471 135 L 456 148 L 429 175 L 427 178 L 427 186 L 431 191 L 435 193 L 442 192 L 471 163 L 499 140 L 528 121 L 542 114 L 549 112 L 552 119 L 555 135 L 555 144 L 556 145 L 556 186 L 555 187 L 555 198 L 554 199 L 554 206 L 553 207 L 550 228 L 544 250 L 539 263 L 539 269 L 548 293 L 551 306 L 551 311 L 555 317 L 559 319 L 564 319 L 567 318 L 571 314 L 572 311 L 571 299 L 568 287 L 563 274 L 563 271 L 561 268 L 561 265 L 565 255 L 570 235 L 573 214 L 574 213 L 574 207 L 575 206 L 576 188 L 577 187 L 577 144 L 576 143 L 576 133 L 575 132 L 573 115 L 570 104 L 567 98 L 561 92 L 557 90 Z M 151 90 L 137 91 L 129 98 L 124 109 L 119 135 L 119 145 L 118 146 L 119 201 L 120 202 L 122 223 L 126 243 L 128 248 L 130 260 L 132 264 L 132 268 L 123 293 L 120 310 L 122 315 L 128 319 L 134 319 L 138 317 L 141 313 L 146 290 L 154 270 L 154 263 L 148 244 L 144 226 L 142 208 L 141 207 L 141 199 L 140 198 L 140 189 L 139 188 L 140 138 L 144 117 L 147 112 L 155 114 L 169 121 L 204 144 L 227 163 L 255 191 L 259 193 L 266 192 L 271 187 L 272 184 L 271 177 L 268 173 L 249 154 L 221 130 L 184 105 L 165 95 Z';

const CAT_EYES =
  'M 445 288 L 438 292 L 432 299 L 428 310 L 429 320 L 433 328 L 439 334 L 448 338 L 460 338 L 469 334 L 476 327 L 480 317 L 480 308 L 477 300 L 469 291 L 460 287 Z M 232 287 L 223 291 L 215 300 L 212 310 L 213 320 L 217 328 L 225 335 L 232 338 L 245 338 L 253 334 L 261 325 L 264 316 L 263 305 L 259 297 L 251 290 L 244 287 Z';

export function DogProfileIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="219 104 554 554">
      <Path d={DOG_BODY} fill={color} fillRule="evenodd" />
      <Path d={DOG_EYES} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

export function CatProfileIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="74 -11 540 540">
      <Path d={CAT_BODY} fill={color} fillRule="evenodd" />
      <Path d={CAT_EYES} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

export function PawOutlineIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx={6.2} cy={9.70} rx={2} ry={2.5} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={9.8} cy={6.50} rx={2.1} ry={2.7} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={14.2} cy={6.50} rx={2.1} ry={2.7} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={17.8} cy={9.70} rx={2} ry={2.5} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M 12 11.3 C 8.4 11.3 5.8 13.7 5.8 16.7 C 5.8 19.1 7.8 20.2 9.8 19.4 C 10.6 19.1 11.3 18.6 12 18.6 C 12.7 18.6 13.4 19.1 14.2 19.4 C 16.2 20.2 18.2 19.1 18.2 16.7 C 18.2 13.7 15.6 11.3 12 11.3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SettingsIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 192 192">
      <Path
        d="M 105.04 39.12 L 113.92 21.36 L 136.16 30.48 L 129.84 49.44 L 142.56 62.16 L 161.52 55.84 L 170.64 78.08 L 152.88 86.96 L 152.88 105.04 L 170.64 113.92 L 161.52 136.16 L 142.56 129.84 L 129.84 142.56 L 136.16 161.52 L 113.92 170.64 L 105.04 152.88 L 86.96 152.88 L 78.08 170.64 L 55.84 161.52 L 62.16 142.56 L 49.44 129.84 L 30.48 136.16 L 21.36 113.92 L 39.12 105.04 L 39.12 86.96 L 21.36 78.08 L 30.48 55.84 L 49.44 62.16 L 62.16 49.44 L 55.84 30.48 L 78.08 21.36 L 86.96 39.12 Z"
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={96} cy={96} r={23.2} fill="none" stroke={color} strokeWidth={16} />
    </Svg>
  );
}
