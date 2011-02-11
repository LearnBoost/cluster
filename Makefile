
DOCS = $(shell find docs/*.md)
HTML = $(DOCS:.md=.html)

all: $(HTML)

%.html: %.md
	ronn --html --fragment < $< \
	| cat head.html - tail.html \
	> $@

clean:
	rm -f docs/*.html

.PHONY: clean