# ☕ Java Installation Guide for Windows

## 🚨 Current Issue
```
The JAVA_HOME environment variable is not defined correctly
```

আপনার system এ Java installed নেই বা properly configured নেই।

---

## ✅ Solution: Java Install করুন

আপনার project **Java 25** ব্যবহার করছে (pom.xml দেখুন):
```xml
<properties>
    <java.version>25</java.version>
</properties>
```

### Option 1: Java 21 LTS (Recommended for Production)

Java 25 এখনো early access। Production এর জন্য **Java 21 LTS** recommended।

#### Step 1: Download Java 21

**Oracle JDK 21:**
https://www.oracle.com/java/technologies/downloads/#java21

অথবা

**OpenJDK 21 (Microsoft Build):**
https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-21

#### Step 2: Install করুন

1. Downloaded `.msi` file run করুন
2. Installation wizard follow করুন
3. Default settings রাখুন
4. **"Set JAVA_HOME variable"** option টিক দিন (important!)

#### Step 3: Verify Installation

PowerShell খুলুন (নতুন window) এবং run করুন:

```powershell
java -version
```

**Expected Output:**
```
java version "21.0.x" 2024-xx-xx LTS
Java(TM) SE Runtime Environment (build 21.0.x+xx-LTS-xxx)
```

#### Step 4: Check JAVA_HOME

```powershell
echo $env:JAVA_HOME
```

**Expected:** কিছু একটা path দেখাবে, যেমন:
```
C:\Program Files\Java\jdk-21
```

---

### Option 2: Manual JAVA_HOME Setup (If Not Set)

যদি Java install করার পরেও `JAVA_HOME` set না হয়:

#### Method 1: System Environment Variables

1. **Windows Search** এ type করুন: `Environment Variables`
2. **"Edit the system environment variables"** click করুন
3. **Environment Variables** button click করুন
4. **System variables** section এ **New** click করুন
5. Add করুন:
   - **Variable name:** `JAVA_HOME`
   - **Variable value:** `C:\Program Files\Java\jdk-21` (আপনার Java install path)
6. **OK** click করুন
7. **PATH variable** edit করুন:
   - `%JAVA_HOME%\bin` যুক্ত করুন
8. **OK** → **OK** → **OK**
9. **PowerShell নতুন করে খুলুন**

#### Method 2: PowerShell Command (Temporary)

Current session এর জন্য:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

**Note:** এটা শুধু current session এর জন্য work করবে।

---

### Option 3: Using Chocolatey (Easy Way)

Chocolatey package manager ব্যবহার করে:

```powershell
# Install Chocolatey (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Java 21
choco install openjdk21 -y

# Refresh environment
refreshenv
```

---

## 🔧 Update pom.xml to Java 21

আপনার `pom.xml` এ Java version 25 থেকে 21 এ change করুন:

```xml
<properties>
    <java.version>21</java.version>
</properties>
```

---

## 🚀 Run Your Application

Java install এবং configure করার পরে:

### Method 1: Using Maven Wrapper (Recommended)

```powershell
.\mvnw clean install
.\mvnw spring-boot:run
```

### Method 2: Using IDE

**IntelliJ IDEA:**
1. Open project
2. Wait for Maven import
3. Run button click করুন
4. অথবা `Shift + F10`

**VS Code:**
1. Install "Spring Boot Extension Pack"
2. Install "Extension Pack for Java"
3. `F5` press করুন অথবা Run → Start Debugging

---

## 🧪 Verify Setup

Run these commands:

```powershell
# Check Java version
java -version

# Check JAVA_HOME
echo $env:JAVA_HOME

# Check Maven wrapper
.\mvnw --version
```

**Expected Output:**
```
Java version: 21.0.x
JAVA_HOME: C:\Program Files\Java\jdk-21
Apache Maven 3.x.x
```

---

## 🐛 Troubleshooting

### Problem 1: "java command not found" after installation

**Solution:**
1. Close all PowerShell windows
2. Open NEW PowerShell window
3. Try again

### Problem 2: JAVA_HOME still not set

**Solution:**
```powershell
# Permanently set (PowerShell profile)
notepad $PROFILE

# Add this line:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Save and restart PowerShell
```

### Problem 3: Multiple Java versions

**Solution:**
```powershell
# List all Java installations
Get-ChildItem "C:\Program Files\Java"

# Set specific version
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
```

---

## ✅ Quick Summary

```powershell
# 1. Download & Install Java 21
# https://www.oracle.com/java/technologies/downloads/#java21

# 2. Verify
java -version
echo $env:JAVA_HOME

# 3. Update pom.xml
# Change <java.version>25</java.version> to <java.version>21</java.version>

# 4. Run application
.\mvnw clean install
.\mvnw spring-boot:run
```

---

## 🎯 After Java Setup

Once Java is installed and configured:

```powershell
# Clean previous builds
.\mvnw clean

# Install dependencies
.\mvnw install

# Run application
.\mvnw spring-boot:run

# Application will start on: http://localhost:8080
```

---

## 📝 Alternative: Use IntelliJ IDEA

যদি command line এ problem হয়, **IntelliJ IDEA Community Edition** (Free) ব্যবহার করুন:

1. Download: https://www.jetbrains.com/idea/download/
2. Install করুন
3. Open Project → আপনার folder select করুন
4. Wait for Maven sync
5. Green Run button click করুন

IntelliJ automatically Java configure করবে এবং application run করবে।

---

## 🆘 Still Having Issues?

যদি Java install করার পরেও problem হয়:

1. **Restart Computer** (environment variables reload হবে)
2. **Check Windows Path:** System Properties → Environment Variables → PATH
3. **Use IDE:** IntelliJ IDEA বা VS Code recommended

---

**Next Step:** Java install করুন, তারপর আবার `.\mvnw spring-boot:run` try করুন! ☕
