
DOCS = $(shell find docs/*.md)
HTML = $(DOCS:.md=.html)

all: $(HTML)

%.html: %.md
	ronn --html --fragment < $< > $@

clean:
	rm -f docs/*.html

.PHONY: clean