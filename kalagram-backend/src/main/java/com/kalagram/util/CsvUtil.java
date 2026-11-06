package com.kalagram.util;

public final class CsvUtil {

    private CsvUtil() {}

    /**
     * Quotes a CSV cell and neutralises spreadsheet formulas. Cell contents come from a public form, and
     * Excel would otherwise execute values such as {@code =HYPERLINK(...)} when an admin opens the export.
     */
    public static String cell(Object value) {
        if (value == null) {
            return "";
        }
        String text = value.toString();
        boolean phoneLike = text.matches("\\+?[0-9 ()-]+");
        if (!phoneLike && !text.isEmpty() && "=+-@\t\r".indexOf(text.charAt(0)) >= 0) {
            text = "'" + text;
        }
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    public static String row(Object... values) {
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                line.append(',');
            }
            line.append(cell(values[i]));
        }
        return line.append("\r\n").toString();
    }
}
