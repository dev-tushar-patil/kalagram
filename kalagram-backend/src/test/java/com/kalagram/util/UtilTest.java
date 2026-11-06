package com.kalagram.util;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class UtilTest {

    @Test
    void csvNeutralisesFormulasButKeepsPhoneNumbers() {
        assertThat(CsvUtil.cell("=HYPERLINK(\"http://x\")")).isEqualTo("\"'=HYPERLINK(\"\"http://x\"\")\"");
        assertThat(CsvUtil.cell("@SUM(A1)")).isEqualTo("\"'@SUM(A1)\"");
        assertThat(CsvUtil.cell("+91 90110 59088")).isEqualTo("\"+91 90110 59088\"");
        assertThat(CsvUtil.cell(null)).isEmpty();
    }

    @Test
    void slugsAreCleanAndUnique() {
        assertThat(SlugUtil.slugify("Earthen Plaster & Finishes")).isEqualTo("earthen-plaster-and-finishes");
        assertThat(SlugUtil.unique("Mud House", Set.of("mud-house", "mud-house-2")::contains)).isEqualTo("mud-house-3");
    }
}
