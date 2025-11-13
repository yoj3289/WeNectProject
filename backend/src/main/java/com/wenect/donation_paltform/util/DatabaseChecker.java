package com.wenect.donation_paltform.util;

import java.sql.*;

/**
 * 데이터베이스 구조 확인 유틸리티
 */
public class DatabaseChecker {

    private static final String URL = "jdbc:mysql://140.245.64.178:33060/mydb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul";
    private static final String USER = "root";
    private static final String PASSWORD = "1!DnlsprxM2@QlalfqjsgH3#";

    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD)) {
            System.out.println("=== 데이터베이스 연결 성공 ===\n");

            // 1. donations 테이블 구조 확인
            System.out.println("=== 1. donations 테이블 구조 ===");
            checkTableStructure(conn, "donations");

            // 2. donation_options 테이블 존재 여부
            System.out.println("\n=== 2. donation_options 테이블 존재 여부 ===");
            checkTableExists(conn, "donation_options");

            // 3. 외래키 제약조건 확인
            System.out.println("\n=== 3. donations 테이블의 외래키 제약조건 ===");
            checkForeignKeys(conn, "donations");

            // 4. 기존 데이터 확인
            System.out.println("\n=== 4. donations 테이블 데이터 확인 ===");
            checkDonationsData(conn);

            // 5. selected_option_id 컬럼 사용 현황
            System.out.println("\n=== 5. selected_option_id 사용 현황 ===");
            checkSelectedOptionIdUsage(conn);

        } catch (SQLException e) {
            System.err.println("데이터베이스 연결 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void checkTableStructure(Connection conn, String tableName) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        ResultSet columns = metaData.getColumns(null, null, tableName, null);

        System.out.printf("%-30s %-15s %-10s %-10s%n", "컬럼명", "타입", "NULL허용", "키");
        System.out.println("-".repeat(70));

        while (columns.next()) {
            String columnName = columns.getString("COLUMN_NAME");
            String columnType = columns.getString("TYPE_NAME");
            int columnSize = columns.getInt("COLUMN_SIZE");
            String isNullable = columns.getString("IS_NULLABLE");

            // 키 정보 확인
            String keyInfo = "";
            ResultSet keys = metaData.getPrimaryKeys(null, null, tableName);
            while (keys.next()) {
                if (keys.getString("COLUMN_NAME").equals(columnName)) {
                    keyInfo = "PRI";
                }
            }
            keys.close();

            System.out.printf("%-30s %-15s %-10s %-10s%n",
                columnName,
                columnType + "(" + columnSize + ")",
                isNullable,
                keyInfo);
        }
        columns.close();
    }

    private static void checkTableExists(Connection conn, String tableName) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        ResultSet tables = metaData.getTables(null, null, tableName, null);

        if (tables.next()) {
            System.out.println("✓ " + tableName + " 테이블이 존재합니다.");

            // 테이블 구조도 출력
            System.out.println("\n" + tableName + " 테이블 구조:");
            checkTableStructure(conn, tableName);
        } else {
            System.out.println("✗ " + tableName + " 테이블이 존재하지 않습니다.");
        }
        tables.close();
    }

    private static void checkForeignKeys(Connection conn, String tableName) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        ResultSet foreignKeys = metaData.getImportedKeys(null, null, tableName);

        System.out.printf("%-20s %-30s -> %-20s %-30s%n",
            "FK 제약조건명", "컬럼", "참조 테이블", "참조 컬럼");
        System.out.println("-".repeat(100));

        boolean hasFK = false;
        while (foreignKeys.next()) {
            hasFK = true;
            String fkName = foreignKeys.getString("FK_NAME");
            String fkColumn = foreignKeys.getString("FKCOLUMN_NAME");
            String pkTable = foreignKeys.getString("PKTABLE_NAME");
            String pkColumn = foreignKeys.getString("PKCOLUMN_NAME");

            System.out.printf("%-20s %-30s -> %-20s %-30s%n",
                fkName, fkColumn, pkTable, pkColumn);
        }

        if (!hasFK) {
            System.out.println("외래키 제약조건이 없습니다.");
        }

        foreignKeys.close();
    }

    private static void checkDonationsData(Connection conn) throws SQLException {
        String sql = "SELECT COUNT(*) as total, " +
                    "SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed, " +
                    "SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending, " +
                    "SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled, " +
                    "SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed " +
                    "FROM donations";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            if (rs.next()) {
                System.out.println("전체 기부 건수: " + rs.getInt("total"));
                System.out.println("  - 완료: " + rs.getInt("completed"));
                System.out.println("  - 대기: " + rs.getInt("pending"));
                System.out.println("  - 취소: " + rs.getInt("cancelled"));
                System.out.println("  - 실패: " + rs.getInt("failed"));
            }
        }
    }

    private static void checkSelectedOptionIdUsage(Connection conn) throws SQLException {
        // selected_option_id 컬럼이 있는지 먼저 확인
        DatabaseMetaData metaData = conn.getMetaData();
        ResultSet columns = metaData.getColumns(null, null, "donations", "selected_option_id");

        if (!columns.next()) {
            System.out.println("✗ selected_option_id 컬럼이 존재하지 않습니다.");
            columns.close();
            return;
        }
        columns.close();

        System.out.println("✓ selected_option_id 컬럼이 존재합니다.");

        String sql = "SELECT " +
                    "COUNT(*) as total, " +
                    "COUNT(selected_option_id) as with_option_id, " +
                    "COUNT(*) - COUNT(selected_option_id) as without_option_id " +
                    "FROM donations";

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            if (rs.next()) {
                int total = rs.getInt("total");
                int withOption = rs.getInt("with_option_id");
                int withoutOption = rs.getInt("without_option_id");

                System.out.println("전체 기부 건수: " + total);
                System.out.println("  - selected_option_id 값 있음: " + withOption);
                System.out.println("  - selected_option_id 값 없음 (NULL): " + withoutOption);

                if (withOption > 0) {
                    System.out.println("\n⚠️  경고: selected_option_id에 데이터가 있습니다!");
                    System.out.println("   엔티티 클래스에 이 필드가 없으면 데이터 손실 가능성이 있습니다.");
                }
            }
        } catch (SQLException e) {
            System.out.println("selected_option_id 조회 실패: " + e.getMessage());
        }
    }
}
