class StudentManager {
  constructor() {
    this.students = [];
    this.filteredStudents = [];
    this.currentSort = { field: "fio", direction: "asc" };
    this.filters = {
      fio: "",
      faculty: "",
      startYear: "",
      endYear: "",
    };

    this.initializeEventListeners();
    this.loadStudentsFromServer();
  }

  initializeEventListeners() {
    document.getElementById("studentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    document.getElementById("filterFio").addEventListener("input", (e) => {
      this.filters.fio = e.target.value;
      this.applyFilters();
    });

    document.getElementById("filterFaculty").addEventListener("input", (e) => {
      this.filters.faculty = e.target.value;
      this.applyFilters();
    });

    document
      .getElementById("filterStartYear")
      .addEventListener("input", (e) => {
        this.filters.startYear = e.target.value;
        this.applyFilters();
      });

    document.getElementById("filterEndYear").addEventListener("input", (e) => {
      this.filters.endYear = e.target.value;
      this.applyFilters();
    });

    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        this.handleSort(th.dataset.sort);
      });
    });
  }

  async loadStudentsFromServer() {
    try {
      const response = await fetch("http://localhost:3000/api/students");
      if (response.ok) {
        this.students = await response.json();
        this.applyFilters();
      } else {
        throw new Error("Ошибка загрузки данных");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось загрузить данные с сервера");
    }
  }

  handleFormSubmit() {
    const formData = new FormData(document.getElementById("studentForm"));
    const student = {
      surname: formData.get("surname").trim(),
      name: formData.get("name").trim(),
      lastname: formData.get("lastname").trim(),
      birthday: formData.get("birthday"),
      studyStart: formData.get("studyStart"),
      faculty: formData.get("faculty").trim(),
    };

    const errors = this.validateStudent(student);

    if (errors.length > 0) {
      this.showFormErrors(errors);
      return;
    }

    this.hideFormErrors();
    this.createStudent(student);
  }

  validateStudent(student) {
    const errors = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    if (!student.surname) errors.push("Фамилия обязательна для заполнения");
    if (!student.name) errors.push("Имя обязательно для заполнения");
    if (!student.lastname) errors.push("Отчество обязательно для заполнения");
    if (!student.birthday)
      errors.push("Дата рождения обязательна для заполнения");
    if (!student.studyStart)
      errors.push("Год начала обучения обязателен для заполнения");
    if (!student.faculty) errors.push("Факультет обязателен для заполнения");

    if (student.birthday) {
      const birthDate = new Date(student.birthday);
      const minDate = new Date("1900-01-01");

      if (birthDate < minDate)
        errors.push("Дата рождения не может быть раньше 01.01.1900");
      if (birthDate > currentDate)
        errors.push("Дата рождения не может быть в будущем");
    }

    if (student.studyStart) {
      const startYear = parseInt(student.studyStart);
      if (startYear < 2000)
        errors.push("Год начала обучения не может быть меньше 2000");
      if (startYear > currentYear)
        errors.push("Год начала обучения не может быть в будущем");
    }

    return errors;
  }

  showFormErrors(errors) {
    const errorsContainer = document.getElementById("formErrors");
    errorsContainer.innerHTML = errors
      .map((error) => `<p>${error}</p>`)
      .join("");
    errorsContainer.classList.add("show");
  }

  hideFormErrors() {
    const errorsContainer = document.getElementById("formErrors");
    errorsContainer.classList.remove("show");
    errorsContainer.innerHTML = "";
  }

  async createStudent(studentData) {
    try {
      const studentToSend = {
        ...studentData,
        birthday: new Date(studentData.birthday).toISOString(),
      };

      const response = await fetch("http://localhost:3000/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentToSend),
      });

      if (response.ok) {
        const newStudent = await response.json();
        this.students.push(newStudent);
        this.applyFilters();
        document.getElementById("studentForm").reset();
        alert("Студент успешно добавлен!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при создании студента");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось добавить студента: " + error.message);
    }
  }

  async deleteStudent(studentId) {
    if (!confirm("Вы уверены, что хотите удалить этого студента?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/students/${studentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        this.students = this.students.filter((s) => s.id !== studentId);
        this.applyFilters();
        alert("Студент успешно удален!");
      } else {
        throw new Error("Ошибка при удалении студента");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Не удалось удалить студента");
    }
  }

  applyFilters() {
    this.filteredStudents = this.students.filter((student) => {
      if (this.filters.fio) {
        const fio =
          `${student.surname} ${student.name} ${student.lastname}`.toLowerCase();
        if (!fio.includes(this.filters.fio.toLowerCase())) return false;
      }

      if (this.filters.faculty) {
        if (
          !student.faculty
            .toLowerCase()
            .includes(this.filters.faculty.toLowerCase())
        )
          return false;
      }

      if (this.filters.startYear) {
        if (student.studyStart !== this.filters.startYear) return false;
      }

      if (this.filters.endYear) {
        const endYear = parseInt(student.studyStart) + 4;
        if (endYear.toString() !== this.filters.endYear) return false;
      }

      return true;
    });

    this.sortStudents();
    this.renderTable();
  }

  handleSort(field) {
    if (this.currentSort.field === field) {
      this.currentSort.direction =
        this.currentSort.direction === "asc" ? "desc" : "asc";
    } else {
      this.currentSort = { field, direction: "asc" };
    }

    this.updateSortHeaders();
    this.sortStudents();
    this.renderTable();
  }

  updateSortHeaders() {
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.innerHTML = th.textContent.replace(" ▼", "").replace(" ▲", "");
      if (th.dataset.sort === this.currentSort.field) {
        th.innerHTML += this.currentSort.direction === "asc" ? " ▼" : " ▲";
      }
    });
  }

  sortStudents() {
    this.filteredStudents.sort((a, b) => {
      let aValue, bValue;

      switch (this.currentSort.field) {
        case "fio":
          aValue = `${a.surname} ${a.name} ${a.lastname}`;
          bValue = `${b.surname} ${b.name} ${b.lastname}`;
          break;
        case "faculty":
          aValue = a.faculty;
          bValue = b.faculty;
          break;
        case "birthday":
          aValue = new Date(a.birthday);
          bValue = new Date(b.birthday);
          break;
        case "studyStart":
          aValue = parseInt(a.studyStart);
          bValue = parseInt(b.studyStart);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return this.currentSort.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return this.currentSort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  calculateAge(birthday) {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  getStudyInfo(student) {
    const startYear = parseInt(student.studyStart);
    const endYear = startYear + 4;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    let courseInfo;
    if (
      currentYear > endYear ||
      (currentYear === endYear && currentMonth >= 8)
    ) {
      courseInfo = "закончил";
    } else {
      const course = currentYear - startYear + (currentMonth >= 8 ? 1 : 0);
      courseInfo = `${course} курс`;
    }

    return {
      period: `${startYear}-${endYear}`,
      courseInfo: courseInfo,
    };
  }

  renderTable() {
    const tbody = document.getElementById("studentsTableBody");

    if (this.filteredStudents.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align: center;">Студенты не найдены</td></tr>';
      return;
    }

    tbody.innerHTML = this.filteredStudents
      .map((student) => {
        const age = this.calculateAge(student.birthday);
        const birthDate = new Date(student.birthday);
        const formattedBirthday = `${birthDate
          .getDate()
          .toString()
          .padStart(2, "0")}.${(birthDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}.${birthDate.getFullYear()}`;

        const studyInfo = this.getStudyInfo(student);

        return `
                <tr>
                    <td>${student.surname} ${student.name} ${student.lastname}</td>
                    <td>${student.faculty}</td>
                    <td>${formattedBirthday} (${age} лет)</td>
                    <td>${studyInfo.period} (${studyInfo.courseInfo})</td>
                    <td>
                        <button class="btn-danger" onclick="studentManager.deleteStudent('${student.id}')">
                            Удалить
                        </button>
                    </td>
                </tr>
            `;
      })
      .join("");
  }
}

const studentManager = new StudentManager();
