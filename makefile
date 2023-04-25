VERSION := $(shell cat manifest.json | jq .version)


.PHONY: firefox
firefox:
	# ifneq (,$(wildcard blocktheblue-firefox-$(VERSION).zip))
	# 	rm "blocktheblue-firefox-${VERSION}.zip"
	# endif

	mv manifest.json chrome-manifest.json
	mv firefox-manifest.json manifest.json
	zip "blocktheblue-firefox-${VERSION}.zip" manifest.json LICENSE readme.md style.css inject.js shared.js assets/* firefox/*
	mv manifest.json firefox-manifest.json
	mv chrome-manifest.json manifest.json

.PHONY: chrome
chrome:
	# ifneq (,$(wildcard blocktheblue-chrome-$(VERSION).zip))
	# 	rm "blocktheblue-chrome-${VERSION}.zip"
	# endif
	zip "blocktheblue-chrome-${VERSION}.zip" manifest.json LICENSE readme.md legacy-verified-users.js style.css inject.js shared.js assets/* chrome/*
