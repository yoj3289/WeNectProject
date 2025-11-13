@echo off
set CLASSPATH=build\classes\java\main;%USERPROFILE%\.gradle\caches\modules-2\files-2.1\mysql\mysql-connector-java\8.0.33\*;%USERPROFILE%\.gradle\caches\modules-2\files-2.1\com.mysql\mysql-connector-j\8.3.0\*

for /r "%USERPROFILE%\.gradle\caches" %%f in (mysql-connector-j-*.jar) do set CLASSPATH=%CLASSPATH%;%%f

java -cp "%CLASSPATH%" com.wenect.donation_paltform.util.DatabaseChecker
