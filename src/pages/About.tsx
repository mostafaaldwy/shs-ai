
export default function About() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">عن الخدمة</h1>
        
        <div className="prose prose-lg mx-auto text-right">
          <p className="text-xl text-gray-600 mb-6">
            نقدم لكم خدمة مبتكرة تجمع بين قوة الذكاء الاصطناعي وموثوقية المصادر الطبية العالمية
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">مميزات الخدمة</h2>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                معلومات دقيقة مستمدة من Micromedex، الموسوعة الدوائية الأولى عالمياً
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                تحليل ذكي للوصفات الطبية وتقديم معلومات مفصلة عن الأدوية
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                واجهة سهلة الاستخدام تناسب جميع المستخدمين
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                حفظ وأرشفة جميع الوصفات الطبية للرجوع إليها لاحقاً
              </li>
            </ul>
          </div>

          <div className="bg-accent/20 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">التزامنا</h2>
            <p className="text-gray-600">
              نلتزم بتقديم معلومات دقيقة وموثوقة عن الأدوية، مع الحفاظ على خصوصية وأمان بيانات المستخدمين.
              نسعى دائماً لتطوير خدماتنا لتلبية احتياجات المستخدمين وتسهيل فهمهم لوصفاتهم الطبية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
