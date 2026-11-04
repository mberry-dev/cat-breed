# Cat Breeds

[![Android build](https://github.com/mberry-dev/cat-breed/actions/workflows/android.yml/badge.svg)](https://github.com/mberry-dev/cat-breed/actions/workflows/android.yml)

Browse cat breeds: pick one from a dropdown to see its photo, origin, life span, weight, temperament and a description. An **Android app** (Kotlin) built for CIS 436 (Mobile Application Development) at the University of Michigan-Dearborn. Breed data and photos come from [The Cat API](https://thecatapi.com).

## Features

- A dropdown filled with every breed from The Cat API, sorted by name
- A photo of the selected breed, with a clear message while it loads or when a breed has no photo
- Origin, life span, weight, temperament and a description. Anything the API doesn't know shows "Unknown" instead of a blank.
- A loading message, and an error message with a **Retry** button if the list can't be loaded
- Picking breeds quickly never shows the wrong photo: a slow answer for an earlier breed is ignored
- Works in portrait and landscape, with larger text in landscape
- Survives screen rotation: the list, the selected breed and the photo stay put without asking the API again

## How it's built

- Two fragments in one activity: `TopFragment` (the dropdown, loading message and Retry button) and `BottomFragment` (the photo and breed details)
- `CatViewModel` with LiveData makes the API requests and keeps the state across rotation, so the two fragments share data and nothing is refetched
- `CatParser` turns the API's JSON into breeds, and `CatFormat` holds the display rules and messages. Neither has Android code in it, so both have unit tests.
- [Volley](https://developer.android.com/training/volley) for the HTTP requests and [Glide](https://github.com/bumptech/glide) for the photos
- The API key is read from a git-ignored file at build time and exposed to the app as `BuildConfig.CAT_API_KEY`, so it is never committed

## Run it

You need a current, stable version of [Android Studio](https://developer.android.com/studio). The project uses Android Gradle Plugin 9.0 and Gradle 9.1, so an older Android Studio may ask you to update before it will open the project.

1. Get a free API key: sign up at [thecatapi.com](https://thecatapi.com) and copy the key from your account.
2. Clone the repo:
   ```bash
   git clone https://github.com/mberry-dev/cat-breed.git
   ```
3. In Android Studio choose **Open** and select the `CatBreedsApp` folder inside the repo. Let Gradle finish syncing. The first sync downloads Gradle and the Java version the project needs, so it needs an internet connection and can take a few minutes.
4. Add your key to the file `CatBreedsApp/local.properties`, which Android Studio creates for you and Git ignores. Add this line to it (keep the existing `sdk.dir` line), then sync again:
   ```
   CAT_API_KEY=your_key_here
   ```
5. Run the app on an emulator or a connected phone (Android 7.0 / API 24 or newer).

Without a key the app still opens, but the breed list shows "Invalid API key" with a Retry button, and Gradle prints a warning when it syncs.

**If it says "Invalid API key":** check that the line in `local.properties` is exactly `CAT_API_KEY=your_key` with no quotes or spaces, then sync Gradle and run again. The free plan is limited to a small number of requests per minute, so if you tap around very fast and a photo is missing, wait a moment and try again.

## Testing

Every change that touches the Android code is also built on GitHub (the **Android build** badge above). That check confirms the project builds with no key, with a key in `local.properties`, and with a key in an environment variable, runs the unit tests, and checks that no key is committed to the repo.

The breed parsing and display rules have unit tests (`CatParserTest`, `CatFormatTest`). Run them with:

```bash
cd CatBreedsApp
./gradlew testDebugUnitTest      # on Windows: gradlew.bat testDebugUnitTest
```

I also tested the app on three Pixel emulator profiles (Pixel 2, Pixel 4 and Pixel 7) with a written test plan: [`CatBreedsApp/CatBreedsApp_TestPlan.xlsx`](CatBreedsApp/CatBreedsApp_TestPlan.xlsx). It has 32 test cases over three days (startup and UI, the API and breeds, and orientation handling), and each one was run on all three devices. The plan was written for the original course version of the app, before the later clean-up.

## Project structure

```
cat-breed/
├── CatBreedsApp/                      # Android app
│   ├── CatBreedsApp_TestPlan.xlsx
│   └── app/src/
│       ├── main/
│       │   ├── java/com/example/catbreedsapp/
│       │   │   ├── MainActivity.kt        # Hosts the two fragments
│       │   │   ├── TopFragment.kt         # Dropdown, loading message, Retry
│       │   │   ├── BottomFragment.kt      # Photo and breed details
│       │   │   ├── CatViewModel.kt        # API requests, state kept across rotation
│       │   │   ├── CatParser.kt           # API JSON to breeds
│       │   │   ├── CatFormat.kt           # Display rules and messages
│       │   │   └── CatBreed.kt            # The breed data model
│       │   └── res/                       # Layouts (portrait and landscape), strings, colors
│       └── test/                          # Unit tests for CatParser and CatFormat
└── .github/workflows/android.yml          # Builds the app and checks the key setup
```
