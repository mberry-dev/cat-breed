import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
}

// The Cat API key is never committed. It is looked up, in order, in:
//   1. CatBreedsApp/local.properties (git-ignored):  CAT_API_KEY=your_key
//   2. A Gradle property, for example in ~/.gradle/gradle.properties
//   3. The CAT_API_KEY environment variable
val localProperties = Properties().apply {
    providers.fileContents(rootProject.layout.projectDirectory.file("local.properties"))
        .asText.orNull?.let { load(it.reader()) }
}
val catApiKey: String = localProperties.getProperty("CAT_API_KEY")
    ?: providers.gradleProperty("CAT_API_KEY").orNull
    ?: providers.environmentVariable("CAT_API_KEY").orNull
    ?: ""
if (catApiKey.isBlank()) {
    logger.warn("CAT_API_KEY is not set. Add CAT_API_KEY=your_key to local.properties. The breed list will fail to load with 'Invalid API key' until you do.")
}

android {
    namespace = "com.example.catbreedsapp"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.catbreedsapp"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Exposed to the app as BuildConfig.CAT_API_KEY (see the lookup at the top of this file)
        buildConfigField("String", "CAT_API_KEY", "\"$catApiKey\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.2.0")
    implementation("androidx.fragment:fragment-ktx:1.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.8.7")
    implementation("com.android.volley:volley:1.2.1")
    implementation("com.github.bumptech.glide:glide:4.16.0")
    testImplementation(libs.junit)
    testImplementation("org.json:json:20240303") // the real org.json, so JSON parsing can be unit tested on a computer
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}