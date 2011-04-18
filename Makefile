
DOCS = $(shell find docs/*.md)
HTML = $(DOCS:.md=.html)

all: $(HTML)

%.html: %.md
	markdown < $< \
	| cat head.html - tail.html \
	> $@

clean:
	rm -f docs/*.html

.PHONY: clean