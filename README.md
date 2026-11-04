# Cat Breeds

[![Web version](https://github.com/mberry-dev/cat-breed/actions/workflows/web.yml/badge.svg)](https://github.com/mberry-dev/cat-breed/actions/workflows/web.yml)
[![Android build](https://github.com/mberry-dev/cat-breed/actions/workflows/android.yml/badge.svg)](https://github.com/mberry-dev/cat-breed/actions/workflows/android.yml)

Browse cat breeds: pick one from a dropdown to see its photo, origin, life span, weight, temperament and a description. Built twice: as an **Android app** (Kotlin) and as a **web version** (JavaScript) you can use right in the browser. Breed data and photos come from [The Cat API](https://thecatapi.com).

**Try it:** https://mberry-dev.github.io/cat-breed/

Built for CIS 436 (Mobile Application Development) at the University of Michigan-Dearborn, then extended with a web version.

| | Android app | Web version |
| --- | --- | --- |
| Breed list | Fetched from The Cat API with your free API key | Fetched from The Cat API when the site is published, with a key kept in a hidden GitHub secret, and saved as a data file |
| Photos | The Cat API | The Cat API (no key needed) |
| Language | Kotlin | JavaScript, no framework or build step |
| Tests | Written test plan on 3 Pixel emulator profiles, unit tests, and a build check on every change | 54 automated tests, plus a live check of The Cat API |

The two versions are built to behave the same: the same layout and colors, the same wording, the same "Unknown" for missing facts, and the same first breed shown on start.

Some breeds have no photo in The Cat API (41 of its 107 breeds when I checked, such as Domestic Shorthair and Thai). Both versions show "No image available" for those, along with the breed's details.

**Why the web version works differently:** a web page's code is public, so an API key placed in it would be visible to everyone. The Cat API's breed list needs a key, so the web version never calls it from the browser. Instead, when the site is published, GitHub fetches the list once using the key stored as a repository secret, and publishes it as a plain data file next to the page. The photo lookup needs no key, so the page calls that directly.

## Web version

- A dropdown filled with every breed, sorted by name, with the first breed shown straight away
- A photo of the selected breed, with a clear message while it loads or when a breed has no photo
- Origin, life span, weight, temperament and a description. Anything the API doesn't know shows "Unknown" instead of a blank.
- Picking breeds quickly never shows the wrong photo: a slow answer for an earlier breed is ignored
- A loading message, and an error message with a **Retry** button
- Works on phones and desktops, in light and dark mode, and with a keyboard and screen readers (it has no accessibility violations in an automated check)

### Run it locally

You need [Node.js](https://nodejs.org) 20 or newer and a free API key from [thecatapi.com](https://thecatapi.com). The page uses JavaScript modules, which browsers won't load from a file opened directly, so it has to be served. And because the breed list is a generated data file, make it first:

1. Put your key where the script can find it, in either of these places (neither is committed to Git):
   - the file `CatBreedsApp/local.properties`, as the line `CAT_API_KEY=your_key_here` (the same line the Android app uses), or
   - an environment variable named `CAT_API_KEY`
2. Run:

```bash
cd web
npm install
npm run update-data
npm start
```

Then open the address it prints in your browser (usually `http://localhost:3000`). It only works while the command above is running on your own computer. `npm run update-data` makes `web/data/breeds.json`, which Git ignores. You only need to run it once, or again to refresh the breeds.

### Tests

54 automated tests with Node's built-in test runner:

- **Breed rules** (11): reading the API's JSON, sorting, skipping broken entries, missing or null fields, and the display wording. These use the same sample data and expected values as the Android unit tests.
- **Data loading** (15): reading the data file, missing or broken data, being offline, cancelled requests, and the photo lookup (including that it sends no key)
- **Data script** (10): finding the key, what goes into the data file, and what happens when the key is rejected
- **Interface** (18): the page is loaded in a simulated browser to check the dropdown, details, "Unknown" values, photos, slow answers arriving out of order, errors and Retry, and that text from the data can't inject markup

```bash
cd web
npm install
npm test
```

A separate **live check** calls the real Cat API and confirms it still answers the way the page expects, including that it allows requests from a web page. It runs on every change and weekly on GitHub, and doesn't block a deploy because the service is outside my control:

```bash
npm run check:api
```

### Publishing (for the repository owner)

The site is published by GitHub Actions. Two one-time settings are needed in the repository:

1. **Settings > Pages > Source:** GitHub Actions
2. **Settings > Secrets and variables > Actions > New repository secret:** name `CAT_API_KEY`, value your Cat API key

### Credits

Breed data and photos from [The Cat API](https://thecatapi.com/).

## Android version

### Features

- A dropdown filled with every breed from The Cat API, sorted by name
- A photo of the selected breed, with a clear message while it loads or when a breed has no photo
- Origin, life span, weight, temperament and a description. Anything the API doesn't know shows "Unknown" instead of a blank.
- A loading message, and an error message with a **Retry** button if the list can't be loaded
- Picking breeds quickly never shows the wrong photo: a slow answer for an earlier breed is ignored
- Works in portrait and landscape, with larger text in landscape
- Survives screen rotation: the list, the selected breed and the photo stay put without asking the API again

### How it's built

- Two fragments in one activity: `TopFragment` (the dropdown, loading message and Retry button) and `BottomFragment` (the photo and breed details)
- `CatViewModel` with LiveData makes the API requests and keeps the state across rotation, so the two fragments share data and nothing is refetched
- `CatParser` turns the API's JSON into breeds, and `CatFormat` holds the display rules and messages. Neither has Android code in it, so both have unit tests.
- [Volley](https://developer.android.com/training/volley) for the HTTP requests and [Glide](https://github.com/bumptech/glide) for the photos
- The API key is read from a git-ignored file at build time and exposed to the app as `BuildConfig.CAT_API_KEY`, so it is never committed

### Run it

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

### Testing

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
├── web/                               # Web version
│   ├── index.html, style.css
│   ├── src/
│   │   ├── breeds.js                  # Reading the API's JSON, display rules, messages
│   │   ├── api.js                     # Loads the data file and the photo address
│   │   ├── ui.js                      # Builds the page and handles input
│   │   └── main.js                    # Starts the page
│   ├── scripts/
│   │   ├── update-data.js             # Makes data/breeds.json using the API key
│   │   └── check-api.js               # Live check of The Cat API
│   ├── tests/                         # Unit and interface tests, with sample data
│   └── data/breeds.json               # Generated, not committed
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
└── .github/workflows/
    ├── web.yml                        # Runs the tests, publishes the site
    └── android.yml                    # Builds the Android app and checks the key setup
```
