export default function SpecificInfo({ formData, setFormData, setThrowError }) {

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <>
            <div className="form-group">
                <label htmlFor="name">Ονοματεπώνυμο</label>
                <input type="text" id="name" name="name" placeholder="π.χ. Γιάννης Παπαδόπουλος" required value={formData.name} onChange={handleInputChange} />
            </div>

            <div className="form-group-row">
                <div className="form-group">
                    <label htmlFor="phone">Τηλέφωνο</label>
                    <input type="tel" id="phone" name="phone" placeholder="69xxxxxxxx" required value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" placeholder="π.χ. email@example.com" required value={formData.email || ''} onChange={handleInputChange} />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="region">Περιοχή</label>
                <select id="region" name="region" required value={formData.region} onChange={handleInputChange}>
                    <option value="">Επίλεξε περιοχή</option>
                    <option value="attiki">Αττική</option>
                    <option value="thessaloniki">Θεσσαλονίκη</option>
                    <option value="patra">Πάτρα</option>
                    <option value="larisa">Λάρισα</option>
                    <option value="other">Άλλη περιοχή</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="contact_time">Πότε να σε καλέσουμε;</label>
                <select id="contact_time" name="contact_time" value={formData.contact_time} onChange={handleInputChange} >
                    <option value="anytime">Οποιαδήποτε ώρα</option>
                    <option value="morning">Πρωί (09:00 - 12:00)</option>
                    <option value="noon">Μεσημερι (12:00 - 15:00)</option>
                    <option value="afternoon">Απόγευμα (15:00 - 18:00)</option>
                    <option value="evening">Βράδυ (18:00 - 21:00)</option>
                </select>
            </div>

            {/* <button type="submit" className="submit-btn">
                Θέλω να με καλέσετε
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </button> */}
        </>
    )
}