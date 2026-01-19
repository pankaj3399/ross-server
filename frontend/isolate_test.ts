
const usePdfExport = () => {
    const exportPdf = async () => {
        try { // 19
             try { // 457
                console.log("inner");
             } finally { // 601
                 console.log("finally");
             } // 605
        } catch (error) { // 606
             console.log("catch");
        } finally { // 608
             console.log("outer finally");
        }
    }
}
