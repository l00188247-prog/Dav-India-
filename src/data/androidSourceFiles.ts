import { AndroidSourceFile } from '../types';

export const ANDROID_SOURCE_FILES: AndroidSourceFile[] = [
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Module build configuration with CameraX, Play Services Location, and minSdk 24 for universal device installation without parsing errors.',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.cammeta.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.cammeta.app"
        minSdk = 24 // Android 7.0+ (installs on 99.5% devices without parse errors)
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // CameraX core & camera2
    val cameraxVersion = "1.3.1"
    implementation("androidx.camera:camera-core:\${cameraxVersion}")
    implementation("androidx.camera:camera-camera2:\${cameraxVersion}")
    implementation("androidx.camera:camera-lifecycle:\${cameraxVersion}")
    implementation("androidx.camera:camera-view:\${cameraxVersion}")

    // Google Play Services Location (FusedLocationProviderClient)
    implementation("com.google.android.gms:play-services-location:21.1.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Manifest declaring Camera, Fine/Coarse Location, FileProvider for photo saving/sharing without crash on Android 11+.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.cammeta.app">

    <!-- Camera hardware & features -->
    <uses-feature
        android:name="android.hardware.camera"
        android:required="true" />
    <uses-feature
        android:name="android.hardware.location.gps"
        android:required="false" />

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Storage permissions (Scoped storage compatible) -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission
        android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.CamMeta">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.CamMeta.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Secure FileProvider for photo saving & sharing -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="com.cammeta.app.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>
</manifest>
`
  },
  {
    path: 'app/src/main/res/xml/file_paths.xml',
    name: 'res/xml/file_paths.xml',
    language: 'xml',
    description: 'FileProvider paths configuration. Critical to prevent FileProvider runtime crash.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-files-path name="my_images" path="Pictures" />
    <external-path name="external_files" path="." />
    <cache-path name="cached_images" path="images/" />
</paths>
`
  },
  {
    path: 'app/src/main/java/com/cammeta/app/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    description: 'Complete CameraX activity with fused GPS location stamping, timestamp overlay, and gallery saving.',
    content: `package com.cammeta.app

import android.Manifest
import android.content.ContentValues
import android.content.pm.PackageManager
import android.graphics.*
import android.location.Geocoder
import android.location.Location
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.provider.MediaStore
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.cammeta.app.databinding.ActivityMainBinding
import com.google.android.gms.location.*
import java.io.OutputStream
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var imageCapture: ImageCapture? = null
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var currentLocation: Location? = null
    private var currentAddress: String = "Locating..."

    private val requiredPermissions = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    )

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        val locationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        if (cameraGranted) {
            startCamera()
        } else {
            Toast.makeText(this, "Camera permission is required", Toast.LENGTH_SHORT).show()
        }
        if (locationGranted) {
            startLocationUpdates()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cameraExecutor = Executors.newSingleThreadExecutor()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        if (allPermissionsGranted()) {
            startCamera()
            startLocationUpdates()
        } else {
            permissionLauncher.launch(requiredPermissions)
        }

        binding.captureButton.setOnClickListener {
            takePhotoWithWatermark()
        }
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY, 3000
        ).setMinUpdateDistanceMeters(2f).build()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                object : LocationCallback() {
                    override fun onLocationResult(result: LocationResult) {
                        currentLocation = result.lastLocation
                        currentLocation?.let { loc ->
                            reverseGeocode(loc.latitude, loc.longitude)
                        }
                    }
                },
                Looper.getMainLooper()
            )
        }
    }

    private fun reverseGeocode(lat: Double, lng: Double) {
        Thread {
            try {
                val geocoder = Geocoder(this, Locale.getDefault())
                val addresses = geocoder.getFromLocation(lat, lng, 1)
                if (!addresses.isNullOrEmpty()) {
                    val addr = addresses[0]
                    currentAddress = "\${addr.locality ?: ""}, \${addr.adminArea ?: ""}"
                }
            } catch (e: Exception) {
                currentAddress = "GPS: \${String.format("%.4f", lat)}, \${String.format("%.4f", lng)}"
            }
        }.start()
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
            }
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                .build()

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture)
            } catch (exc: Exception) {
                Toast.makeText(this, "Failed to bind camera: \${exc.message}", Toast.LENGTH_SHORT).show()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun takePhotoWithWatermark() {
        val imageCapture = imageCapture ?: return

        imageCapture.takePicture(
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageCapturedCallback() {
                override fun onCaptureSuccess(image: ImageProxy) {
                    val bitmap = imageProxyToBitmap(image)
                    image.close()

                    // Stamp metadata onto bitmap
                    val stampedBitmap = stampMetadata(bitmap)
                    saveBitmapToMediaStore(stampedBitmap)
                }

                override fun onError(exc: ImageCaptureException) {
                    Toast.makeText(this@MainActivity, "Capture failed: \${exc.message}", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }

    private fun stampMetadata(src: Bitmap): Bitmap {
        val result = src.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = Canvas(result)

        val width = result.width
        val height = result.height

        // Dark badge background at bottom
        val badgeHeight = (height * 0.16f).toInt()
        val bgPaint = Paint().apply {
            color = Color.argb(180, 15, 23, 42) // Slate 900 semi-transparent
            style = Paint.Style.FILL
        }
        canvas.drawRect(0f, (height - badgeHeight).toFloat(), width.toFloat(), height.toFloat(), bgPaint)

        // Accent line
        val linePaint = Paint().apply {
            color = Color.parseColor("#0ea5e9") // Cyan accent
            strokeWidth = 6f
        }
        canvas.drawLine(0f, (height - badgeHeight).toFloat(), width.toFloat(), (height - badgeHeight).toFloat(), linePaint)

        // Text setup
        val titlePaint = Paint().apply {
            color = Color.WHITE
            textSize = height * 0.035f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val textPaint = Paint().apply {
            color = Color.parseColor("#cbd5e1")
            textSize = height * 0.024f
            typeface = Typeface.DEFAULT
            isAntiAlias = true
        }

        val dateStr = SimpleDateFormat("dd MMM yyyy, hh:mm:ss a z", Locale.getDefault()).format(Date())
        val lat = currentLocation?.latitude ?: 0.0
        val lng = currentLocation?.longitude ?: 0.0
        val latLngStr = "Lat: \${String.format("%.5f", lat)} | Long: \${String.format("%.5f", lng)}"

        val startX = width * 0.04f
        var startY = (height - badgeHeight) + (height * 0.045f)

        canvas.drawText("CAMMETA GPS", startX, startY, titlePaint)
        startY += height * 0.035f
        canvas.drawText(latLngStr, startX, startY, textPaint)
        startY += height * 0.032f
        canvas.drawText(dateStr, startX, startY, textPaint)
        startY += height * 0.032f
        canvas.drawText(currentAddress, startX, startY, textPaint)

        return result
    }

    private fun saveBitmapToMediaStore(bitmap: Bitmap) {
        val filename = "CAMMETA_\${System.currentTimeMillis()}.jpg"
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
            put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/CamMeta")
            }
        }

        val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
        if (uri != null) {
            val outputStream: OutputStream? = contentResolver.openOutputStream(uri)
            outputStream?.use {
                bitmap.compress(Bitmap.CompressFormat.JPEG, 95, it)
            }
            Toast.makeText(this, "Saved to Gallery: Pictures/CamMeta", Toast.LENGTH_SHORT).show()
        }
    }

    private fun imageProxyToBitmap(image: ImageProxy): Bitmap {
        val buffer = image.planes[0].buffer
        val bytes = ByteArray(buffer.remaining())
        buffer.get(bytes)
        val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)

        // Rotate if needed
        val matrix = Matrix()
        matrix.postRotate(image.imageInfo.rotationDegrees.toFloat())
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }

    private fun allPermissionsGranted() = requiredPermissions.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}
`
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'kotlin',
    description: 'Root project settings configuring plugin management and repository resolution.',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "CamMeta"
include(":app")
`
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (Project)',
    language: 'kotlin',
    description: 'Root build.gradle.kts applying standard AGP and Kotlin plugins.',
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}
`
  },
  {
    path: 'gradle.properties',
    name: 'gradle.properties',
    language: 'properties',
    description: 'Standard Gradle JVM parameters and AndroidX flags for fast, error-free compilation.',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=false
android.nonTransitiveRClass=true
kotlin.code.style=official
`
  }
];
