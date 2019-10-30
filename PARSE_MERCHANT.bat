@echo off
start CMD /C mongo
start CMD /C node "%~dp0merchant.js"
