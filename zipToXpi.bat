@echo zipping...
del f:\github\firedog\firedog.xpi
d:\7-zip\7z a -r f:\github\firedog\firedog.xpi f:\github\firedog\defaults f:\github\firedog\chrome f:\github\firedog\install.rdf f:\github\firedog\icon.png f:\github\firedog\chrome.manifest
@echo zip done!
exit
