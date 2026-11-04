CatBreedsApp
CIS 436 - Mobile Application Development
University of Michigan - Dearborn
Professor: John P. Baugh

Project Description:
This application allows users to browse different cat breeds using the Cat API.
Users can select a breed from a dropdown spinner to view information including
the cat's name, origin, life span, weight, temperament, and a description.
A photo of the selected breed is also displayed when available.

Features:
- Dropdown spinner populated with all cat breeds from the Cat API
- Cat image loaded from the Cat API for each breed
- Breed information including name, origin, life span, weight, temperament, and description
- Anything the API does not know is shown as "Unknown"
- Loading message, and an error message with a Retry button
- Scrollable bottom fragment for easy reading
- Landscape and portrait orientation support
- Breed list and selection retained across orientation changes using ViewModel
- Bold labels for easy reading
- Larger text in landscape mode

API KEY:
The Cat API key is NOT stored in the repository. Get a free key at
thecatapi.com, then add this line to CatBreedsApp/local.properties
(Android Studio creates that file and Git ignores it):

CAT_API_KEY=your_key_here

The build also accepts the key as a Gradle property (for example in
~/.gradle/gradle.properties) or as a CAT_API_KEY environment variable. It is
available in the app as BuildConfig.CAT_API_KEY. Without a key the app opens,
but the breed list shows "Invalid API key".

See the README.md in the repository root for the full setup steps.

Emulators:
- Pixel 2
- Pixel 4
- Pixel 7
