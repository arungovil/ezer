package core

import "testing"

func TestParsePageOrigin(t *testing.T) {
	cases := map[string]string{
		"https://Example.com/a/b?x=1#h": "https://example.com",
		"https://example.com:443/":      "https://example.com",
		"http://example.com:80":         "http://example.com",
		"http://localhost:3000/path":    "http://localhost:3000",
		"https://[::1]:8443/x":          "https://[::1]:8443",
		"file:///Users/a/notes.html":    "null",
		"chrome://extensions":           "null",
	}
	for raw, want := range cases {
		got, err := parsePageOrigin(raw)
		if err != nil || got != want {
			t.Errorf("parsePageOrigin(%q) = %q, %v; want %q", raw, got, err, want)
		}
	}

	for _, raw := range []string{"", "nonsense", "/relative/path", "https://", "http://%zz"} {
		if got, err := parsePageOrigin(raw); err == nil {
			t.Errorf("parsePageOrigin(%q) = %q, want error", raw, got)
		}
	}
}

func TestFormatDueDate(t *testing.T) {
	for raw, want := range map[string]string{
		"2026-03-04T10:00:00Z": "3/4/2026",
		"2026-03-04T10:00:00":  "3/4/2026",
		"2026-03-04":           "3/4/2026",
	} {
		if got, ok := formatDueDate(raw); !ok || got != want {
			t.Errorf("formatDueDate(%q) = %q, %v; want %q", raw, got, ok, want)
		}
	}

	if _, ok := formatDueDate("next friday"); ok {
		t.Error("unparseable date should be reported, not guessed")
	}
}

func TestMakeMatchQuery(t *testing.T) {
	got := makeMatchQuery([]string{`dam"s`, "  ", "it's", "plain"})
	if want := `"dams" OR "its" OR "plain"`; got != want {
		t.Fatalf("makeMatchQuery = %q, want %q", got, want)
	}
	if got := makeMatchQuery([]string{"", `"`}); got != "" {
		t.Fatalf("makeMatchQuery of blanks = %q, want empty", got)
	}
}
